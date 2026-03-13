.PHONY: dev api create-user clean

dev: # Start development environment
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@if [ ! -f api/.env ]; then cp api/.env.example api/.env; fi
	@if [ ! -f client/.env ]; then cp client/.env.example client/.env; fi
	docker compose up -d --build database nginx php-fpm ingest
	cd client && pnpm install && pnpm dev

api: # Rebuild and restart API services
	docker compose up -d --build nginx php-fpm
	docker compose exec php-fpm composer install --no-interaction

create-user: # Create a user (usage: make create-user u=admin p=secret)
	docker compose exec php-fpm bin/console app:create-user $(u) $(p)

clean: # Clean generated files and remove volumes
	docker compose down -v
	rm -rf api/vendor
	rm -rf api/var/cache/*
	rm -rf client/node_modules
