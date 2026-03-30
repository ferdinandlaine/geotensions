.PHONY: dev api create-user clean

dev: # Start development environment
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@if [ ! -f api/.env ]; then cp api/.env.example api/.env; fi
	@if [ ! -f client/.env ]; then cp client/.env.example client/.env; fi
	@if [ ! -f scripts/ingest/.env ]; then cp scripts/ingest/.env.example scripts/ingest/.env; fi
	docker compose up -d --build api database ingest
	cd client && pnpm install && pnpm dev

api: # Rebuild and restart API services
	docker compose up -d --build api
	docker compose exec api composer install --no-interaction

database: # Start database only
	docker compose up -d database

ingest: database # Ingest CSV files from data/ directory (one-shot)
	docker compose run --rm ingest python ingest_acled.py

create-user: # Create a user (usage: make create-user u=admin p=secret)
	docker compose exec api bin/console app:create-user $(u) $(p)

clean: # Clean generated files and remove volumes
	docker compose down -v
	rm -rf api/vendor
	rm -rf api/var/cache/*
	rm -rf client/node_modules
