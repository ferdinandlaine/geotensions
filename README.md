# GeoTensions

Data visualization application for [ACLED](https://acleddata.com) (Armed Conflict Location & Event Data).

Explore conflicts through an interactive map, time brush and filters.

## Quick Start

```bash
make dev # Start development environment
```

- Access web app: **http://localhost:5173**
- Browse API: **http://localhost:8080**

## Commands

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `make dev`         | Start development environment                  |
| `make api`         | Build and start API service                    |
| `make ingest`      | Ingest CSV files (one-shot)                    |
| `make create-user` | Usage: `make create-user u=admin p=secret`     |
| `make clean`       | Remove database volume, dependencies and cache |

## ACLED Data & Methodology

- **Source**: [Data Export Tool](https://acleddata.com/conflict-data/data-export-tool) (research-level access required)
- **Documentation**: [ACLED Codebook](https://acleddata.com/methodology/acled-codebook)

### Data Ingestion

1. Export data with all output options unchecked
2. Upload a CSV file

   ```bash
   curl -u admin:secret -F "file=@acled_data.csv" http://localhost:5050/
   ```

   > Credentials are set in `scripts/ingest/.env`

   Or batch-process files from `data/` with `make ingest`

### Important notes

- **Event ID**: API uses ACLED's official identifier (e.g. "FRA37186"), not the database primary key

## License

This project is licensed under the [Apache License 2.0](LICENSE).
