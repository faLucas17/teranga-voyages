.PHONY: up down logs test fresh shell dev build

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f backend

test:
	docker compose exec backend php artisan test

fresh:
	docker compose exec backend php artisan app:setup --fresh

shell:
	docker compose exec backend bash

dev:
	docker compose --profile dev up -d frontend-dev
	@echo "Frontend avec rechargement à chaud : http://localhost:5183"

build:
	docker compose up -d --build web
