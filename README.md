# README.md

## Project Overview

**Geotensions** is a data visualization application analyzing ACLED (Armed Conflict Location & Event Data) events.

The application combines an interactive map, timeline with brush filtering, and dynamic faceted filters to explore political violence and protest events.

## Stack

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + MapLibre GL 5 + react-map-gl 8
- **Backend**: Symfony 7.4 (PHP 8.2+) + Doctrine DBAL (no ORM)
- **Database**: PostgreSQL 18 + PostGIS 3.6
- **Ingestion**: Python 3.12 + pandas + psycopg3 (automated with cron)
- **Container**: Docker Compose for all services

## Development Commands

### Client

```bash
# Install dependencies
cd client && pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Lint
pnpm lint

# Preview production build locally
pnpm preview
```

### API

```bash
# Install dependencies
docker compose exec php-fpm composer install

# Symfony console
docker compose exec php-fpm php bin/console

# Create/run database migrations
docker compose exec php-fpm php bin/console doctrine:migrations:migrate

# Clear Symfony cache
docker compose exec php-fpm php bin/console cache:clear
```

### Docker Compose

```bash
# Start all services
docker compose up -d

# Stop services
docker compose down

# Stop services + remove volumes
docker compose down -v

# View logs
docker compose logs -f
```

## Services

- Web client: http://localhost:80 (port configurable via `CLIENT_PORT`)
- Symfony API: http://localhost:8000 (port configurable via `API_PORT`)
- PostgreSQL: http://localhost:5432 (port configurable via `POSTGRES_PORT`)

## Data Ingestion

Place ACLED CSV files in `data/incoming/` directory. The ingestion service automatically processes them:

1. CSV files are detected (pattern: `*ACLED*.csv`)
2. Events are normalized and inserted into PostgreSQL with PostGIS geometry
3. Duplicate events are handled via `acled_id` unique constraint (updates only if timestamp is newer)
4. Processed files are archived to `data/archived/` with timestamp

Manual ingestion:

```bash
docker compose exec ingest python /app/ingest_acled.py
```

## ACLED Dataset

- **Source**: https://acleddata.com/
- **Documentation**: https://acleddata.com/methodology/acled-codebook

### Event Types

1. **Protests**: Peaceful protest, protest with intervention, excessive force
2. **Riots**: Violent demonstrations, urban violence
3. **Violence against civilians**: Targeted attacks
4. **Strategic developments**: Troop movements, strategic changes

### Critical Interpretation Notes

- `event_type`/`sub_event_type`: Follow ACLED methodology (not arbitrary)
- `fatalities`: Display with caution - may use conventional values (e.g., 3, 10) when exact count unknown
- Coverage: Not exhaustive ground truth - coded from media sources
- Always display `source` and `notes` when available
