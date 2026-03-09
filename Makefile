SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help setup-dev bootstrap up down restart dev logs status db-seed seed-validate pipeline-seed pipeline-deploy pipeline-dry clean

help:
	@echo "Local Dev Commands (Intui)"
	@echo "  make setup-dev      - One-command local bootstrap (deps + env + infra + prisma + seed)"
	@echo "  make bootstrap      - Alias for setup-dev"
	@echo "  make up             - Start local infra (postgres + redis + executor)"
	@echo "  make down           - Stop local infra"
	@echo "  make restart        - Restart local infra"
	@echo "  make dev            - Run Next.js dev server"
	@echo "  make logs           - Tail infra logs"
	@echo "  make status         - Show infra container status"
	@echo "  make db-seed        - Seed DB from prisma/seed-data.json"
	@echo "  make seed-validate  - Validate prisma/seed-data.json"
	@echo "  make pipeline-seed  - Seed DB from question-pipeline tracker/output"
	@echo "  make pipeline-deploy- Upload question-pipeline artifacts + merge seed-data"
	@echo "  make pipeline-dry   - Dry-run production publish flow"
	@echo "  make clean          - Stop infra and remove local volumes"

setup-dev:
	@echo "[1/7] Installing dependencies"
	pnpm install
	@echo "[2/7] Ensuring .env.local exists"
	@if [ ! -f .env.local ]; then cp .env.local.example .env.local; echo "Created .env.local from template"; else echo ".env.local already exists"; fi
	@echo "[3/7] Starting local infra"
	docker compose -f compose-dev.yml up --build -d
	@echo "[4/7] Generating Prisma client"
	pnpm prisma generate
	@echo "[5/7] Applying database migrations"
	pnpm prisma migrate deploy
	@echo "[6/7] Seeding base data"
	pnpm run db:seed
	@echo "[7/7] Done. Start app with: make dev"

bootstrap: setup-dev

up:
	docker compose -f compose-dev.yml up --build -d

down:
	docker compose -f compose-dev.yml down

restart: down up

dev:
	pnpm dev

logs:
	docker compose -f compose-dev.yml logs -f

status:
	docker compose -f compose-dev.yml ps

db-seed:
	pnpm run db:seed

seed-validate:
	pnpm run seed:validate

pipeline-seed:
	pnpm run pipeline:seed-local

pipeline-deploy:
	pnpm run pipeline:deploy

pipeline-dry:
	pnpm run pipeline:deploy -- --dry-run

clean:
	docker compose -f compose-dev.yml down -v
