# ============================================
# Sales Force - Docker Commands Helper
# ============================================

.PHONY: help dev dev-nginx prod prod-local prod-build prod-local-build prod-logs prod-local-logs prod-down prod-local-down up down restart logs build clean install db-connect db-migrate db-migrate-status db-migrate-rollback

# Default target
help:
	@echo "Sales Force - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development mode (BE + FE + DB)"
	@echo "  make dev-nginx    - Start development with nginx"
	@echo "  make dev-build    - Build development containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod             - Start production mode (server)"
	@echo "  make prod-local       - Start production mode locally (port 8080)"
	@echo "  make prod-build       - Build production containers (server)"
	@echo "  make prod-local-build - Build production containers (local)"
	@echo ""
	@echo "Management:"
	@echo "  make up               - Start all services (dev)"
	@echo "  make down             - Stop all services (dev)"
	@echo "  make restart          - Restart all services (dev)"
	@echo "  make logs             - Show logs from all services (dev)"
	@echo "  make logs-fe          - Show frontend logs (dev)"
	@echo "  make logs-be          - Show backend logs (dev)"
	@echo "  make logs-db          - Show database logs (dev)"
	@echo "  make logs-nginx       - Show nginx logs (dev)"
	@echo "  make prod-down        - Stop production services (prod)"
	@echo "  make prod-local-down  - Stop production services (prod-local)"
	@echo "  make prod-logs        - Show logs from all services (prod)"
	@echo "  make prod-local-logs  - Show logs from all services (prod-local)"
	@echo ""
	@echo "Database:"
	@echo "  make db-init              - Initialize database (create + migrate)"
	@echo "  make db-connect           - Connect to PostgreSQL"
	@echo "  make db-reset             - Reset database (WARNING: deletes data)"
	@echo "  make db-hard-reset        - Hard reset database (drop & recreate)"
	@echo "  make db-migrate           - Run database migrations"
	@echo "  make db-migrate-status    - Check migration status"
	@echo "  make db-migrate-rollback  - Rollback last migration"
	@echo "  make db-fix-property-type - Remove property_type CHECK constraint"
	@echo ""
	@echo "Maintenance:"
	@echo "  make build        - Rebuild all containers"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make install      - Install dependencies locally"

# ============================================
# Development Commands
# ============================================
dev:
	@echo "Starting development environment..."
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up

dev-nginx:
	@echo "Starting development with nginx..."
	docker compose --env-file .env.devnginx -f docker-compose.yml -f docker-compose.dev.yml --profile nginx up

dev-build:
	@echo "Building development containers..."
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml build --no-cache

# ============================================
# Production Commands
# ============================================
prod:
	@echo "Starting production environment..."
	docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build:
	@echo "Building production containers..."
	docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml build

prod-logs:
	docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml logs -f

prod-down:
	docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml down

# ============================================
# Local Production Commands
# ============================================

local-prod:
	@echo "Starting production environment locally (port 8080)..."
	docker compose --env-file .env.localprod -f docker-compose.yml -f docker-compose.prod.yml up -d
	
local-prod-build:
	@echo "Building production containers for local..."
	docker compose --env-file .env.localprod -f docker-compose.yml -f docker-compose.prod.yml build

local-prod-logs:
	docker compose --env-file .env.localprod -f docker-compose.yml -f docker-compose.prod.yml logs -f

local-prod-down:
	docker compose --env-file .env.localprod -f docker-compose.yml -f docker-compose.prod.yml down

# ============================================
# Management Commands
# ============================================
up:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d

down:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down

restart:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml restart

logs:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f

logs-logs:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend

logs-be:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

logs-db:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f postgres

logs-nginx:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f nginx

# ============================================
# Database Commands
# ============================================
db-connect:
	docker exec -it sales-force-db psql -U $${DB_USER:-postgres} -d $${DB_NAME:-salesforce}

db-init:
	@echo "Initializing database..."
	docker exec -it sales-force-db psql -U $${DB_USER:-postgres} -c "CREATE DATABASE $${DB_NAME:-salesforce};" 2>/dev/null || true
	docker exec -it sales-force-be npm run db:migrate

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down -v; \
		docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d; \
	fi

db-migrate:
	docker exec -it sales-force-be npm run db:migrate

db-migrate-status:
	docker exec -it sales-force-be npm run db:migrate:status

db-migrate-rollback:
	docker exec -it sales-force-be npm run db:migrate:rollback

# ============================================
# Maintenance Commands
# ============================================
build:
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml build --no-cache

clean:
	@echo "Removing all containers, volumes, and images..."
	docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi all

install:
	@echo "Installing dependencies..."
	cd sales-force-fe && npm install
	cd ../sales-force-be && npm install
