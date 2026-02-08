#!/usr/bin/env python3
"""
ACLED data ingestion script

1. Read CSV files from the incoming directory
2. Normalize data (dates, coordinates, fatalities)
3. Insert events into PostgreSQL with PostGIS geometry
4. Archive processed files
"""

import csv
import os
import sys
import time
import logging
from datetime import datetime
from pathlib import Path

import pandas
import psycopg
from psycopg import sql

# Configure logging with UTC timestamps
logging.Formatter.converter = time.gmtime
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
    datefmt='%a %b %d %H:%M:%S UTC %Y'
)

logger = logging.getLogger('ingest_acled')

# Environment variables
DATABASE_URL = os.getenv('DATABASE_URL')
INCOMING_DIR = Path(os.getenv('INCOMING_DIR')) if os.getenv('INCOMING_DIR') else None
ARCHIVED_DIR = Path(os.getenv('ARCHIVED_DIR')) if os.getenv('ARCHIVED_DIR') else None

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
if not INCOMING_DIR:
    raise ValueError("INCOMING_DIR environment variable is required")
if not ARCHIVED_DIR:
    raise ValueError("ARCHIVED_DIR environment variable is required")

# ACLED CSV column mapping
COLUMN_MAPPING = {
    'event_id_cnty': 'acled_id',
    'event_date': 'date',
    'disorder_type': 'disorder_type',
    'event_type': 'type',
    'sub_event_type': 'sub_type',
    'actor1': 'actor1',
    'actor2': 'actor2',
    'inter1': 'inter1',
    'inter2': 'inter2',
    'assoc_actor_1': 'assoc_actor_1',
    'assoc_actor_2': 'assoc_actor_2',
    'interaction': 'interaction',
    'iso': 'iso',
    'region': 'region',
    'country': 'country',
    'admin1': 'admin1',
    'admin2': 'admin2',
    'admin3': 'admin3',
    'location': 'location',
    'latitude': 'latitude',
    'longitude': 'longitude',
    'geo_precision': 'geo_precision',
    'civilian_targeting': 'civilian_targeting',
    'fatalities': 'fatalities',
    'source': 'source',
    'source_scale': 'source_scale',
    'notes': 'notes',
    'tags': 'tags',
    'timestamp': 'timestamp'
}


def get_db_connection():
    """Create and return a PostgreSQL database connection."""
    conn = psycopg.connect(DATABASE_URL)
    logger.info("Connected to database")
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

    # Parse date
    df['date'] = pandas.to_datetime(df['date'], format='%Y-%m-%d').dt.date

    # Ensure numeric types
    df['iso'] = df['iso'].astype(int)
    df['latitude'] = df['latitude'].astype(float)
    df['longitude'] = df['longitude'].astype(float)
    df['geo_precision'] = df['geo_precision'].astype(int)
    df['fatalities'] = df['fatalities'].fillna(0).astype(int)
    df['timestamp'] = df['timestamp'].astype(int)

    # Handle boolean civilian_targeting
    # ACLED exports empty string for False, non-empty for True
    df['civilian_targeting'] = df['civilian_targeting'].notnull() & (df['civilian_targeting'] != '')

    # Handle nullable text fields - replace NaN with None for proper SQL NULL
    text_fields = ['actor2', 'inter2', 'assoc_actor_1', 'assoc_actor_2', 'admin2', 'admin3', 'tags']
    for field in text_fields:
        df[field] = df[field].where(pandas.notna(df[field]), None)

    # Validate coordinates
    invalid_coords = (
        (df['latitude'] < -90) | (df['latitude'] > 90) |
        (df['longitude'] < -180) | (df['longitude'] > 180)
    )
    if invalid_coords.any():
        logger.warning(f"Found {invalid_coords.sum()} events with invalid coordinates – skipping")
        df = df[~invalid_coords].copy()

    # Validate geo_precision
    invalid_precision = ~df['geo_precision'].isin([1, 2, 3])
    if invalid_precision.any():
        logger.warning(f"Found {invalid_precision.sum()} events with invalid geo_precision – skipping")
        df = df[~invalid_precision].copy()

    logger.info(f"Normalization complete: {len(df)} valid events")
    return df


def insert_events(conn, df):
    """Insert events into the database with upsert based on timestamp.

    Args:
        conn: Database connection
        df: Normalized DataFrame
    """
    if len(df) == 0:
        logger.info("No events to insert")
        return

    logger.info(f"Inserting {len(df)} events into database")

    # SQL UPSERT statement
    # Note: geometry is calculated from longitude/latitude using PostGIS
    # ON CONFLICT: only update if new timestamp is greater (more recent data from ACLED)
    upsert_query = """
        INSERT INTO events (
            acled_id, date, type, sub_type, disorder_type,
            actor1, actor2, inter1, inter2, assoc_actor_1, assoc_actor_2, interaction,
            iso, region, country, admin1, admin2, admin3, location,
            latitude, longitude, geo_precision, geom,
            civilian_targeting, fatalities,
            source, source_scale, notes, tags,
            timestamp
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326),
            %s, %s,
            %s, %s, %s, %s,
            %s
        )
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
            interaction = EXCLUDED.interaction,
            iso = EXCLUDED.iso,
            region = EXCLUDED.region,
            country = EXCLUDED.country,
            admin1 = EXCLUDED.admin1,
            admin2 = EXCLUDED.admin2,
            admin3 = EXCLUDED.admin3,
            location = EXCLUDED.location,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
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

    upserted_count = 0
    skipped_count = 0
    error_count = 0

    with conn.cursor() as cur:
        for idx, row in df.iterrows():
            try:
                cur.execute(upsert_query, (
                    row['acled_id'],
                    row['date'],
                    row['type'],
                    row['sub_type'],
                    row['disorder_type'],
                    row['actor1'],
                    row['actor2'],
                    row['inter1'],
                    row['inter2'],
                    row['assoc_actor_1'],
                    row['assoc_actor_2'],
                    row['interaction'],
                    row['iso'],
                    row['region'],
                    row['country'],
                    row['admin1'],
                    row['admin2'],
                    row['admin3'],
                    row['location'],
                    row['latitude'],
                    row['longitude'],
                    row['geo_precision'],
                    row['longitude'],  # For ST_MakePoint (lon, lat)
                    row['latitude'],   # For ST_MakePoint (lon, lat)
                    row['civilian_targeting'],
                    row['fatalities'],
                    row['source'],
                    row['source_scale'],
                    row['notes'],
                    row['tags'],
                    row['timestamp']
                ))

                # rowcount = 1: INSERT or UPDATE succeeded
                # rowcount = 0: WHERE clause prevented UPDATE (timestamp not newer)
                if cur.rowcount == 1:
                    upserted_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                logger.error(f"Error upserting event {row['acled_id']}: {e}")
                error_count += 1
                conn.rollback()
                continue

        conn.commit()

    # skipped = older/same timestamp
    logger.info(f"Upsert complete: {upserted_count} upserted, {skipped_count} skipped, {error_count} errors")


def process_csv_file(filepath):
    """
    Process a CSV file and insert events into the database.

    Args:
        filepath: Path to the CSV file to process
    """
    logger.info(f"Processing file: {filepath}")

    # Detect CSV delimiter (handles ACLED "compatibility mode" which uses semicolons)
    with open(filepath, 'r', newline='') as f:
        sample = f.read(8192)
        dialect = csv.Sniffer().sniff(sample, delimiters=',;')

    if dialect.delimiter != ',':
        logger.warning(f"Detected non-standard delimiter '{dialect.delimiter}' — expected comma-delimited CSV")

    df = pandas.read_csv(filepath, sep=dialect.delimiter)
    df_normalized = normalize_dataframe(df)
    conn = get_db_connection()

    try:
        insert_events(conn, df_normalized)
    finally:
        conn.close()


def archive_file(filepath):
    """Archive processed file with timestamp."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filepath.rename(ARCHIVED_DIR / f"{filepath.stem}_{timestamp}{filepath.suffix}")

def main():
    """Main execution function."""
    INCOMING_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVED_DIR.mkdir(parents=True, exist_ok=True)

    csv_files = list(INCOMING_DIR.glob('*ACLED*.csv', case_sensitive=False))

    if not csv_files:
        logger.debug("No CSV files found in incoming directory")
        return

    logger.info(f"{len(csv_files)} incoming file(s) found")

    for csv_file in csv_files:
        try:
            process_csv_file(csv_file)
        except Exception as e:
            logger.error(f"Failed to process {csv_file}: {e}")
            continue

        try:
            archive_file(csv_file)
            logger.info(f"Archived {csv_file}")
        except Exception as e:
            logger.error(f"Failed to archive {csv_file}: {e}")


try:
    main()
except Exception as e: 
    logger.error(f"Fatal error: {e}", exc_info=True)
    sys.exit(1)
