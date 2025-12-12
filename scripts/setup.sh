#!/bin/bash

set -e

echo "🚀 Setting up Inventory Management System..."

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed!"

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

# Setup git hooks
echo "🔗 Setting up git hooks..."
chmod +x scripts/pre-commit
chmod +x scripts/pre-push
mkdir -p .git/hooks
cp scripts/pre-commit .git/hooks/pre-commit
cp scripts/pre-push .git/hooks/pre-push

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backups
mkdir -p logs

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

echo ""
echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Run 'make up' to start the application"
echo "3. Run 'make monitoring-up' to start monitoring"
echo "4. Run 'make jenkins-up' to start Jenkins"
echo ""
echo "For more commands, run 'make help'"
