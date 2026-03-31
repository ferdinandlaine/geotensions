# GeoTensions

Data visualization application for [ACLED](https://acleddata.com) (Armed Conflict Location & Event Data).

Explore conflicts through an interactive map with a time brush and filters.

## Quick Start

```bash
# Start development environment
make dev
```

- Access web app: **http://localhost:5173**
- Browse API: **http://localhost:8080**

## Commands

| Command            | Description                                        |
| ------------------ | -------------------------------------------------- |
| `make dev`         | Start development environment                      |
| `make api`         | Rebuild and restart API services                   |
| `make ingest`      | Ingest CSV files from `data/` directory (one-shot) |
| `make create-user` | Create a user (make create-user u=admin p=secret)  |
| `make clean`       | Clean generated files and remove volumes           |

## ACLED Data & Methodology

- **Source**: [Data Export Tool](https://acleddata.com/conflict-data/data-export-tool) (research-level access required)
- **Documentation**: [ACLED Codebook](https://acleddata.com/methodology/acled-codebook)

### Data Ingestion

1. Export data with all output options unchecked
2. Upload a CSV file:

   ```bash
   curl -u admin:secret -F "file=@acled_data.csv" http://localhost:5050/
   ```

   Credentials are set via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `scripts/ingest/.env`.

   Or batch-process files already in `data/` with `make ingest`.

### Important notes

- **Event IDs**: The API uses ACLED's official identifiers (`acled_id` like "FRA37186"), not database internal IDs.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
