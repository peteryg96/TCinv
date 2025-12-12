# Setup Guide

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- npm or yarn
- Git

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd inventory-management-system
```

### 2. Run setup script
```bash
./scripts/setup.sh
```

### 3. Configure environment
```bash
# Edit .env with your actual credentials
nano .env
```

### 4. Start services
```bash
make all-up
```

### 5. Access applications
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB Express: http://localhost:8081
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Jenkins: http://localhost:8080

## Development Workflow

### Daily Development
```bash
# Start development environment
make up

# View logs
make logs

# Run tests
make test

# Stop services
make down
```

### Making Changes
1. Create feature branch
2. Make changes
3. Run `make test` and `make lint`
4. Commit (pre-commit hooks will run)
5. Push (pre-push hooks will run tests)
6. Create pull request

## Useful Commands
Run `make help` to see all available commands.