.PHONY: help build up down restart logs test clean install dev monitoring jenkins

# Colors for output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

help: ## Show this help message
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "  ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)

## Docker Commands
build: ## Build all Docker images
	@echo "${GREEN}Building Docker images...${RESET}"
	docker-compose build --no-cache

up: ## Start all services
	@echo "${GREEN}Starting all services...${RESET}"
	docker-compose up -d
	@echo "${GREEN}Services started!${RESET}"
	@echo "Frontend: ${CYAN}http://localhost:3000${RESET}"
	@echo "Backend: ${CYAN}http://localhost:5000${RESET}"
	@echo "MongoDB Express: ${CYAN}http://localhost:8081${RESET}"

down: ## Stop all services
	@echo "${YELLOW}Stopping all services...${RESET}"
	docker-compose down

down-volumes: ## Stop all services and remove volumes
	@echo "${YELLOW}Stopping all services and removing volumes...${RESET}"
	docker-compose down -v

restart: ## Restart all services
	@echo "${YELLOW}Restarting all services...${RESET}"
	docker-compose restart

ps: ## Show running containers
	docker-compose ps

## Logs
logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-mongodb: ## View MongoDB logs
	docker-compose logs -f mongodb

## Testing
test: ## Run all tests
	@echo "${GREEN}Running backend tests...${RESET}"
	cd backend && npm test
	@echo "${GREEN}Running frontend tests...${RESET}"
	cd frontend && npm test

test-backend: ## Run backend tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-coverage: ## Run tests with coverage
	@echo "${GREEN}Running tests with coverage...${RESET}"
	cd backend && npm run test:coverage
	cd frontend && npm run test:coverage

test-watch: ## Run tests in watch mode
	cd backend && npm run test:watch

## Development
install: ## Install dependencies for both frontend and backend
	@echo "${GREEN}Installing backend dependencies...${RESET}"
	cd backend && npm install
	@echo "${GREEN}Installing frontend dependencies...${RESET}"
	cd frontend && npm install

dev-backend: ## Start backend in development mode
	cd backend && npm run dev

dev-frontend: ## Start frontend in development mode
	cd frontend && npm run dev

lint: ## Run linters
	@echo "${GREEN}Linting backend...${RESET}"
	cd backend && npm run lint || echo "Backend linting not configured"
	@echo "${GREEN}Linting frontend...${RESET}"
	cd frontend && npm run lint

lint-fix: ## Fix linting issues
	cd backend && npm run lint:fix || echo "Backend linting not configured"
	cd frontend && npm run lint -- --fix

## Container Shell Access
shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-mongodb: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p password123

## Database Operations
db-backup: ## Backup MongoDB database
	@echo "${GREEN}Backing up database...${RESET}"
	@mkdir -p backups
	docker-compose exec -T mongodb mongodump \
		--uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
		--archive > backups/backup-$(shell date +%Y%m%d-%H%M%S).dump
	@echo "${GREEN}Backup completed!${RESET}"

db-restore: ## Restore MongoDB database (usage: make db-restore FILE=backup.dump)
	@echo "${YELLOW}Restoring database from ${FILE}...${RESET}"
	docker-compose exec -T mongodb mongorestore \
		--uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
		--archive < $(FILE)
	@echo "${GREEN}Restore completed!${RESET}"

db-seed: ## Seed database with sample data
	@echo "${GREEN}Seeding database...${RESET}"
	cd backend && npm run seed

## Cleanup
clean: ## Clean up containers, volumes, and images
	@echo "${YELLOW}Cleaning up...${RESET}"
	docker-compose down -v
	docker system prune -f
	@echo "${GREEN}Cleanup completed!${RESET}"

clean-all: ## Deep clean (remove node_modules, build files, etc.)
	@echo "${YELLOW}Deep cleaning...${RESET}"
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/coverage
	rm -rf frontend/coverage
	rm -rf backend/dist
	rm -rf frontend/dist
	docker-compose down -v
	docker system prune -af
	@echo "${GREEN}Deep clean completed!${RESET}"

## Monitoring
monitoring-up: ## Start monitoring stack (Prometheus, Grafana)
	@echo "${GREEN}Starting monitoring stack...${RESET}"
	cd monitoring && docker-compose up -d
	@echo "${GREEN}Monitoring started!${RESET}"
	@echo "Prometheus: ${CYAN}http://localhost:9090${RESET}"
	@echo "Grafana: ${CYAN}http://localhost:3001${RESET} (admin/admin)"
	@echo "Alertmanager: ${CYAN}http://localhost:9093${RESET}"

monitoring-down: ## Stop monitoring stack
	@echo "${YELLOW}Stopping monitoring stack...${RESET}"
	cd monitoring && docker-compose down

monitoring-logs: ## View monitoring logs
	cd monitoring && docker-compose logs -f

prometheus: ## Open Prometheus UI in browser
	@echo "${CYAN}Opening Prometheus...${RESET}"
	@open http://localhost:9090 2>/dev/null || xdg-open http://localhost:9090 2>/dev/null || echo "Open http://localhost:9090"

grafana: ## Open Grafana UI in browser
	@echo "${CYAN}Opening Grafana...${RESET}"
	@echo "Default credentials: admin/admin"
	@open http://localhost:3001 2>/dev/null || xdg-open http://localhost:3001 2>/dev/null || echo "Open http://localhost:3001"

## Jenkins
jenkins-up: ## Start Jenkins
	@echo "${GREEN}Starting Jenkins...${RESET}"
	cd jenkins && docker-compose up -d
	@echo "${GREEN}Jenkins started!${RESET}"
	@echo "Jenkins: ${CYAN}http://localhost:8080${RESET}"

jenkins-down: ## Stop Jenkins
	@echo "${YELLOW}Stopping Jenkins...${RESET}"
	cd jenkins && docker-compose down

jenkins-logs: ## View Jenkins logs
	cd jenkins && docker-compose logs -f

jenkins-password: ## Get Jenkins initial admin password
	@echo "${CYAN}Jenkins Initial Admin Password:${RESET}"
	@docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

## All Services
all-up: ## Start all services (app + monitoring + jenkins)
	@echo "${GREEN}Starting all services...${RESET}"
	make up
	make monitoring-up
	make jenkins-up
	@echo ""
	@echo "${GREEN}All services started!${RESET}"
	@echo ""
	@echo "${CYAN}=== Application ===${RESET}"
	@echo "Frontend:        http://localhost:3000"
	@echo "Backend API:     http://localhost:5000"
	@echo "MongoDB Express: http://localhost:8081"
	@echo ""
	@echo "${CYAN}=== Monitoring ===${RESET}"
	@echo "Prometheus:      http://localhost:9090"
	@echo "Grafana:         http://localhost:3001 (admin/admin)"
	@echo "Alertmanager:    http://localhost:9093"
	@echo ""
	@echo "${CYAN}=== CI/CD ===${RESET}"
	@echo "Jenkins:         http://localhost:8080"
	@echo ""

all-down: ## Stop all services
	@echo "${YELLOW}Stopping all services...${RESET}"
	make down
	make monitoring-down
	make jenkins-down
	@echo "${GREEN}All services stopped!${RESET}"

all-logs: ## View all logs
	@echo "${CYAN}Viewing logs from all services (Ctrl+C to exit)...${RESET}"
	docker-compose logs -f &
	cd monitoring && docker-compose logs -f &
	cd jenkins && docker-compose logs -f

status: ## Show status of all services
	@echo "${CYAN}=== Application Services ===${RESET}"
	@docker-compose ps
	@echo ""
	@echo "${CYAN}=== Monitoring Services ===${RESET}"
	@cd monitoring && docker-compose ps
	@echo ""
	@echo "${CYAN}=== Jenkins Services ===${RESET}"
	@cd jenkins && docker-compose ps

## Health Checks
health: ## Check health of all services
	@echo "${CYAN}Checking service health...${RESET}"
	@echo ""
	@echo "${YELLOW}Backend:${RESET}"
	@curl -s http://localhost:5000/api/health | jq || echo "Backend not responding"
	@echo ""
	@echo "${YELLOW}Prometheus:${RESET}"
	@curl -s http://localhost:9090/-/healthy || echo "Prometheus not responding"
	@echo ""
	@echo "${YELLOW}Grafana:${RESET}"
	@curl -s http://localhost:3001/api/health | jq || echo "Grafana not responding"
	@echo ""

## Production
prod-build: ## Build production images
	@echo "${GREEN}Building production images...${RESET}"
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production services
	@echo "${GREEN}Starting production services...${RESET}"
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	@echo "${YELLOW}Stopping production services...${RESET}"
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

## Git Hooks
setup-hooks: ## Setup git hooks
	@echo "${GREEN}Setting up git hooks...${RESET}"
	@cp scripts/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@cp scripts/pre-push .git/hooks/pre-push
	@chmod +x .git/hooks/pre-push
	@echo "${GREEN}Git hooks installed!${RESET}"