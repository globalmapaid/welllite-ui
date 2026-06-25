.PHONY: help build up down logs deploy

COMPOSE = docker compose

help:
	@echo "WellLite UI — production container (run on the server)"
	@echo "  make build    build the image and start the container"
	@echo "  make up       start the container"
	@echo "  make down     stop the container"
	@echo "  make logs     tail container logs"
	@echo "  make deploy   git pull + rebuild + restart"
	@echo ""
	@echo "Local development uses 'npm run dev' (no Docker)."

build:
	$(COMPOSE) up -d --build --remove-orphans

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f ui

# ─── production deploy (run on server, in ~/welllite-ui) ───────────────────────
deploy:
	git pull
	$(COMPOSE) up -d --build --remove-orphans
