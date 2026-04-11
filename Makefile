.PHONY: help dev dev:api dev:web build test lint typecheck db:up db:migrate db:seed db:studio

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services in parallel
	pnpm dev

dev:api: ## Start API only
	pnpm dev:api

dev:web: ## Start web only
	pnpm dev:web

build: ## Build all packages
	pnpm build

test: ## Run all tests
	pnpm test

lint: ## Lint all packages
	pnpm lint

typecheck: ## Type-check all packages
	pnpm typecheck

db:up: ## Start database container
	docker compose up -d

db:migrate: ## Run Prisma migrations
	pnpm db:migrate

db:seed: ## Seed database with sample data
	pnpm db:seed

db:studio: ## Open Prisma Studio
	pnpm db:studio

install: ## Install all dependencies
	pnpm install
