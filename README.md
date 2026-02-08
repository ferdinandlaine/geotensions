# GeoTensions

Data visualization application for [ACLED](https://acleddata.com) (Armed Conflict Location & Event Data).

Explore events through an interactive map, brushable timeline, and dynamic faceted filters.

## Quick Start

```bash
# Copy env files
cp .env.example .env
cp api/.env.example api/.env
cp client/.env.example client/.env
```

Configure database connection in root `.env`: `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.

```bash
# Start development environment
make dev
```

- Access web app: **http://localhost:5173**
- Browse API documentation: **http://localhost:8000/api/doc**

## Commands

| Command      | Description                              |
| ------------ | ---------------------------------------- |
| `make dev`   | Start development environment            |
| `make api`   | Rebuild and restart API services         |
| `make clean` | Clean generated files and remove volumes |

## ACLED Data & Methodology

- **Source**: [Data Export Tool](https://acleddata.com/conflict-data/data-export-tool) (research-level access required)
- **Documentation**: [ACLED Codebook](https://acleddata.com/methodology/acled-codebook)

### Data Ingestion

1. Export data with all output options unchecked
2. Place CSV files in `/data/incoming/` — the ingestion service processes them automatically:
   - Events are normalized and inserted into PostgreSQL with PostGIS geometry
   - Duplicates are handled via `acled_id` unique constraint (updates only if timestamp is newer)
   - Processed files are archived to `data/archived/` with timestamp

### Critical Interpretation Notes

- **Event IDs**: The API uses ACLED's official identifiers (`acled_id` like "FRA37186"), not database internal IDs

## License

This project is licensed under the [Apache License 2.0](LICENSE).
