#!/bin/bash

echo "🚀 Starting Inventory Management System..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your credentials before proceeding"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 15

# Seed database
echo "🌱 Seeding database..."
cd backend && npm run seed
cd ..

echo ""
echo "✅ System is ready!"
echo ""
echo "🌐 Access points:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend:         http://localhost:5000"
echo "   MongoDB Express: http://localhost:8081"
echo ""
echo "Run 'make logs' to view logs"
echo "Run 'make down' to stop services"
