#!/usr/bin/env python3
"""
ACLED data ingestion script

1. Read CSV files from the data directory
2. Normalize data (dates, coordinates, fatalities)
3. Insert events into PostgreSQL with PostGIS geometry
"""

import csv
import os
import sys
import time
import logging

from pathlib import Path

import pandas
import psycopg

logging.Formatter.converter = time.gmtime
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%a %b %d %H:%M:%S UTC %Y",
)

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
DATA_DIR = Path(os.getenv("DATA_DIR")) if os.getenv("DATA_DIR") else Path("/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# ACLED CSV column mapping
COLUMN_MAPPING = {
    "event_id_cnty": "acled_id",
    "event_date": "date",
    "disorder_type": "disorder_type",
    "event_type": "type",
    "sub_event_type": "sub_type",
    "actor1": "actor1",
    "actor2": "actor2",
    "inter1": "inter1",
    "inter2": "inter2",
    "assoc_actor_1": "assoc_actor_1",
    "assoc_actor_2": "assoc_actor_2",
    "iso": "iso",
    "region": "region",
    "country": "country",
    "admin1": "admin1",
    "admin2": "admin2",
    "admin3": "admin3",
    "location": "location",
    "latitude": "latitude",
    "longitude": "longitude",
    "geo_precision": "geo_precision",
    "civilian_targeting": "civilian_targeting",
    "fatalities": "fatalities",
    "source": "source",
    "source_scale": "source_scale",
    "notes": "notes",
    "tags": "tags",
    "timestamp": "timestamp",
}


def connect_db():
    """Create and return a PostgreSQL database connection."""
    conn = psycopg.connect(DATABASE_URL)
    return conn


def normalize_dataframe(df):
    """
    Normalize and validate pandas DataFrame.

    Args:
        df: Raw pandas DataFrame from CSV

    Returns:
        Normalized DataFrame ready for insertion
    """
    logger.info(f"Normalizing {len(df)} rows")

    df = df.rename(columns=COLUMN_MAPPING)
    df["date"] = pandas.to_datetime(df["date"], format="%Y-%m-%d").dt.date
    df["iso"] = df["iso"].astype(int)
    df["latitude"] = df["latitude"].astype(float)
    df["longitude"] = df["longitude"].astype(float)
    df["geo_precision"] = df["geo_precision"].astype(int)
    df["fatalities"] = df["fatalities"].fillna(0).astype(int)
    df["timestamp"] = df["timestamp"].astype(int)
    # Handle boolean civilian_targeting
    # ACLED exports empty string for False, non-empty for True
    df["civilian_targeting"] = df["civilian_targeting"].notnull() & (
        df["civilian_targeting"] != ""
    )
    # Handle nullable text fields - replace NaN with None for proper SQL NULL
    text_fields = [
        "actor2",
        "inter2",
        "assoc_actor_1",
        "assoc_actor_2",
        "admin2",
        "admin3",
        "tags",
    ]
    for field in text_fields:
        df[field] = df[field].where(pandas.notna(df[field]), None)

    invalid_coords = (
        (df["latitude"] < -90)
        | (df["latitude"] > 90)
        | (df["longitude"] < -180)
        | (df["longitude"] > 180)
    )
    if invalid_coords.any():
        logger.warning(
            f"Found {invalid_coords.sum()} events with invalid coordinates – skipping"
        )
        df = df[~invalid_coords].copy()

    invalid_precision = ~df["geo_precision"].isin([1, 2, 3])
    if invalid_precision.any():
        logger.warning(
            f"Found {invalid_precision.sum()} events with invalid geo_precision – skipping"
        )
        df = df[~invalid_precision].copy()

    logger.info(f"Normalization complete: {len(df)} valid events")
    return df


def insert_events(conn, df):
    """Insert events into the database with upsert based on timestamp.

    Uses PostgreSQL COPY protocol to bulk-load into a temp table,
    then a single INSERT ... ON CONFLICT to upsert into the events table.

    Args:
        conn: Database connection
        df: Normalized DataFrame

    Returns:
        Tuple of (upserted_count, skipped_count)
    """
    if len(df) == 0:
        logger.info("No events to insert")
        return 0, 0

    logger.info(f"Upserting {len(df)} events")

    copy_columns = [
        "acled_id",
        "date",
        "type",
        "sub_type",
        "disorder_type",
        "actor1",
        "actor2",
        "inter1",
        "inter2",
        "assoc_actor_1",
        "assoc_actor_2",
        "iso",
        "region",
        "country",
        "admin1",
        "admin2",
        "admin3",
        "location",
        "latitude",
        "longitude",
        "geo_precision",
        "civilian_targeting",
        "fatalities",
        "source",
        "source_scale",
        "notes",
        "tags",
        "timestamp",
    ]

    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TEMP TABLE _staging (
                acled_id TEXT,
                date DATE,
                type TEXT,
                sub_type TEXT,
                disorder_type TEXT,
                actor1 TEXT,
                actor2 TEXT,
                inter1 TEXT,
                inter2 TEXT,
                assoc_actor_1 TEXT,
                assoc_actor_2 TEXT,
                iso INTEGER,
                region TEXT,
                country TEXT,
                admin1 TEXT,
                admin2 TEXT,
                admin3 TEXT,
                location TEXT,
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                geo_precision INTEGER,
                civilian_targeting BOOLEAN,
                fatalities INTEGER,
                source TEXT,
                source_scale TEXT,
                notes TEXT,
                tags TEXT,
                timestamp BIGINT
            ) ON COMMIT DROP
        """
        )

        # Bulk load into staging table using COPY protocol
        col_names = ", ".join(copy_columns)
        with cur.copy(f"COPY _staging ({col_names}) FROM STDIN") as copy:
            for idx, row in df.iterrows():
                copy.write_row([row[col] for col in copy_columns])

        # Single upsert from staging into events
        # Geometry is computed from lon/lat, conflicts resolved by timestamp
        cur.execute(
            """
            INSERT INTO events (
                acled_id, date, type, sub_type, disorder_type,
                actor1, actor2, inter1, inter2, assoc_actor_1, assoc_actor_2,
                iso, region, country, admin1, admin2, admin3, location, geo_precision, geom,
                civilian_targeting, fatalities, source, source_scale, notes, tags, timestamp
            )
            SELECT
                acled_id, date, type, sub_type, disorder_type,
                actor1, actor2, inter1, inter2, assoc_actor_1, assoc_actor_2,
                iso, region, country, admin1, admin2, admin3, location,
                geo_precision, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                civilian_targeting, fatalities, source, source_scale, notes, tags, timestamp
            FROM _staging
            ON CONFLICT (acled_id) DO UPDATE SET
                date = EXCLUDED.date,
                type = EXCLUDED.type,
                sub_type = EXCLUDED.sub_type,
                disorder_type = EXCLUDED.disorder_type,
                actor1 = EXCLUDED.actor1,
                actor2 = EXCLUDED.actor2,
                inter1 = EXCLUDED.inter1,
                inter2 = EXCLUDED.inter2,
                assoc_actor_1 = EXCLUDED.assoc_actor_1,
                assoc_actor_2 = EXCLUDED.assoc_actor_2,
                iso = EXCLUDED.iso,
                region = EXCLUDED.region,
                country = EXCLUDED.country,
                admin1 = EXCLUDED.admin1,
                admin2 = EXCLUDED.admin2,
                admin3 = EXCLUDED.admin3,
                location = EXCLUDED.location,
                geo_precision = EXCLUDED.geo_precision,
                geom = EXCLUDED.geom,
                civilian_targeting = EXCLUDED.civilian_targeting,
                fatalities = EXCLUDED.fatalities,
                source = EXCLUDED.source,
                source_scale = EXCLUDED.source_scale,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags,
                timestamp = EXCLUDED.timestamp,
                updated_at = now()
            WHERE EXCLUDED.timestamp > events.timestamp
        """
        )

        upserted_count = cur.rowcount
        skipped_count = len(df) - upserted_count

        conn.commit()

    return upserted_count, skipped_count


def process_csv_file(filepath, conn):
    """
    Process a CSV file and insert events into the database.

    Args:
        filepath: Path to the CSV file to process
        conn: Database connection

    Returns:
        Tuple of (upserted_count, skipped_count)
    """
    logger.info(f"Processing file: {filepath}")

    # Detect CSV delimiter (handles ACLED "compatibility mode" which uses semicolons)
    with open(filepath, "r", newline="") as f:
        sample = f.read(8192)
        dialect = csv.Sniffer().sniff(sample, delimiters=",;")

    df = pandas.read_csv(filepath, sep=dialect.delimiter)
    df_normalized = normalize_dataframe(df)
    upserted, skipped = insert_events(conn, df_normalized)
    filename = Path(filepath).name
    logger.info(
        f"Upsert complete for {filename}: {upserted} upserted, {skipped} skipped"
    )
    return upserted, skipped


def main():
    """Main execution function."""
    if len(sys.argv) > 1:
        csv_file = Path(sys.argv[1])
        if not csv_file.exists():
            logger.error(f"File {csv_file} does not exist")
            sys.exit(1)

        conn = connect_db()

        try:
            process_csv_file(csv_file, conn)
            csv_file.unlink()
        except Exception as e:
            logger.error(f"Failed to process {csv_file}: {e}")
            sys.exit(1)
        finally:
            conn.close()
    else:
        csv_files = sorted(DATA_DIR.glob("*.csv"))

        if not csv_files:
            logger.debug(f"No CSV files found in {DATA_DIR}")
            return

        logger.info(f"{len(csv_files)} data file(s) found")

        total_upserted = 0
        total_skipped = 0
        processed = 0
        conn = connect_db()

        try:
            for csv_file in csv_files:
                try:
                    upserted, skipped = process_csv_file(csv_file, conn)
                    total_upserted += upserted
                    total_skipped += skipped
                    processed += 1
                    csv_file.unlink()
                except Exception as e:
                    logger.error(f"Failed to process {csv_file}: {e}")
                    conn.rollback()
                    continue
        finally:
            conn.close()

        logger.info(
            f"Ingestion complete: {processed} file(s) processed, {total_upserted} upserted, {total_skipped} skipped"
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
