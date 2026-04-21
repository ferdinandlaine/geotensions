.PHONY: dev api ingest create-user clean

dev: # Start development environment
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@if [ ! -f api/.env ]; then cp api/.env.example api/.env; fi
	@if [ ! -f client/.env ]; then cp client/.env.example client/.env; fi
	@if [ ! -f scripts/ingest/.env ]; then cp scripts/ingest/.env.example scripts/ingest/.env; fi
	docker compose up -d --build api database ingest
	cd client && pnpm install && pnpm dev

api: # Build and start API service
	docker compose up -d --build api
	docker compose exec api composer install --no-interaction

database:
	docker compose up -d database

ingest: database # Ingest CSV files (one-shot)
	docker compose run --rm ingest python ingest_acled.py

create-user: # Usage: `make create-user u=admin p=secret`
	docker compose exec api bin/console app:create-user $(u) $(p)

clean: # Remove database volume, dependencies and cache
	docker compose down -v
	rm -rf client/node_modules api/vendor api/var/cache
