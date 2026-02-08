# README.md

**Geotensions** is a data visualization application for ACLED (Armed Conflict Location & Event Data).

The application features an interactive map, timeline with brush filtering, and dynamic faceted filters.

## Quick Start

```bash
# Start development environment (installs deps, starts services, runs client)
make dev
```

## Make Commands

| Command      | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `make dev`   | Install client deps, start Docker services, run Vite dev server |
| `make api`   | Rebuild and restart API services                                |
| `make clean` | Full cleanup: stop services, remove volumes and node_modules    |

## Manual Commands

### Client

```bash
cd client && pnpm install   # Install dependencies
pnpm dev                    # Development server
pnpm build                  # Production build
pnpm lint                   # Lint
pnpm preview                # Preview production build
```

### Docker Compose

```bash
docker compose up -d        # Start all services
docker compose down         # Stop services
docker compose down -v      # Stop + remove volumes
docker compose logs -f      # View logs
```

### API

```bash
docker compose exec php-fpm composer install
docker compose exec php-fpm php bin/console
docker compose exec php-fpm php bin/console doctrine:migrations:migrate
docker compose exec php-fpm php bin/console cache:clear
```

## Services

- **Web client**: http://localhost:80 (configurable with `CLIENT_PORT`)
- **Symfony API**: http://localhost:8000 (configurable with `API_PORT`)
- **PostgreSQL**: http://localhost:5432 (configurable with `POSTGRES_PORT`)

## Data

- **Source**: [ACLED (Armed Conflict Location & Event Data)](https://acleddata.com).
- **Codebook**: https://acleddata.com/methodology/acled-codebook

### Data Ingestion

Place ACLED CSV files in `data/incoming/` directory. The ingestion service automatically processes them:

1. CSV files are detected (pattern: `*ACLED*.csv`)
2. Events are normalized and inserted into PostgreSQL with PostGIS geometry
3. Duplicate events are handled via `acled_id` unique constraint (updates only if timestamp is newer)
4. Processed files are archived to `data/archived/` with timestamp

### Critical Interpretation Notes

- **`event_type`/`sub_event_type`**: Follow ACLED methodology (not arbitrary)
- **Event IDs**: The API uses ACLED's official identifiers (`acled_id` like "FRA37186"), not database internal IDs, ensuring stable URLs across environments

## License

This project is licensed under the [Apache License 2.0](LICENSE).
