#!/bin/bash

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.dump"

echo "📦 Creating backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump \
    --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
    --archive > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: $BACKUP_FILE.gz"

# Keep only last 7 backups
echo "🧹 Cleaning old backups..."
ls -t $BACKUP_DIR/backup-*.dump.gz | tail -n +8 | xargs -r rm

echo "✅ Backup completed!"
