CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    acled_id VARCHAR(32) NOT NULL UNIQUE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    sub_type TEXT NOT NULL,
    disorder_type TEXT NOT NULL,

    -- Actors
    actor1 TEXT NOT NULL,
    actor2 TEXT,
    inter1 TEXT NOT NULL,
    inter2 TEXT,
    assoc_actor_1 TEXT,
    assoc_actor_2 TEXT,
    interaction TEXT NOT NULL,
    
    -- Geographic
    iso SMALLINT NOT NULL CHECK (iso BETWEEN 1 AND 999),
    region VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    admin1 VARCHAR(255) NOT NULL,
    admin2 VARCHAR(255),
    admin3 VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geo_precision SMALLINT NOT NULL CHECK (geo_precision BETWEEN 1 AND 3),

    -- PostGIS geometry
    geom GEOMETRY(Point, 4326) NOT NULL,
    
    -- Event details
    civilian_targeting BOOLEAN NOT NULL DEFAULT FALSE,
    fatalities INTEGER NOT NULL DEFAULT 0 CHECK (fatalities >= 0),
    source TEXT NOT NULL,
    source_scale TEXT NOT NULL,
    notes TEXT NOT NULL,
    tags TEXT,

    -- Audit trail
    timestamp BIGINT NOT NULL, -- Last modified by ACLED
    imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index (essential for map queries)
CREATE INDEX events_geom_idx ON events USING GIST(geom);

-- Composite index for date-ordered queries (supports ORDER BY date DESC, id DESC)
CREATE INDEX events_date_id_idx ON events(date DESC, id DESC);

-- Event type index (for filtering by event type)
CREATE INDEX events_type_idx ON events(type);
