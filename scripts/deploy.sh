#!/bin/bash

set -e

ENV=$1
if [ -z "$ENV" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

echo "🚀 Deploying to $ENV..."

# Load environment variables
if [ "$ENV" = "staging" ]; then
    HOST=$STAGING_HOST
    USER=$STAGING_USERNAME
    COMPOSE_FILE="docker-compose.yml"
elif [ "$ENV" = "production" ]; then
    HOST=$PRODUCTION_HOST
    USER=$PRODUCTION_USERNAME
    COMPOSE_FILE="docker-compose.prod.yml"
else
    echo "Invalid environment: $ENV"
    exit 1
fi

# Deploy
echo "📦 Pulling latest images..."
ssh $USER@$HOST "cd /opt/inventory-app && docker-compose -f $COMPOSE_FILE pull"

echo "🔄 Updating services..."
ssh $USER@$HOST "cd /opt/inventory-app && docker-compose -f $COMPOSE_FILE up -d"

echo "🧹 Cleaning up..."
ssh $USER@$HOST "docker system prune -f"

echo "✅ Deployment to $ENV completed!"

# Health check
echo "🏥 Running health check..."
sleep 10
HEALTH_URL="https://$HOST/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed! HTTP $HTTP_CODE"
    exit 1
fi
