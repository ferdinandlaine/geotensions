.PHONY: dev down logs db api client clean

# Start everything for development
dev:
	cd client && pnpm install
	docker compose up -d database nginx php-fpm ingest
	cd client && pnpm dev

# Stop all services
down:
	docker compose down

# View logs
logs:
	docker compose logs -f

# Database shell
db:
	docker compose exec database psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-geotensions}

# Rebuild and restart API
api:
	docker compose up -d --build nginx php-fpm

# Run client only (assumes services are running)
client:
	cd client && pnpm dev

# Full rebuild
clean:
	docker compose down -v
	rm -rf client/node_modules
