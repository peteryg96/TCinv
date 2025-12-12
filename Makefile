.PHONY: help build up down restart logs test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

test: ## Run all tests
	cd backend && npm test
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

clean: ## Clean up containers, volumes, and images
	docker-compose down -v
	docker system prune -f

install: ## Install dependencies for both frontend and backend
	cd backend && npm install
	cd frontend && npm install

dev-backend: ## Start backend in development mode
	cd backend && npm run dev

dev-frontend: ## Start frontend in development mode
	cd frontend && npm run dev

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p password123

backup-db: ## Backup MongoDB database
	docker-compose exec -T mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" --archive > backup-$(shell date +%Y%m%d-%H%M%S).dump

restore-db: ## Restore MongoDB database (use: make restore-db FILE=backup.dump)
	docker-compose exec -T mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" --archive < $(FILE)