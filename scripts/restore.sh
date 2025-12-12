#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup-file>"
    echo "Available backups:"
    ls -lh ./backups/*.dump.gz
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  Warning: This will restore the database from backup"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

echo "📦 Restoring database..."

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker-compose exec -T mongodb mongorestore \
        --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
        --archive
else
    docker-compose exec -T mongodb mongorestore \
        --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
        --archive < $BACKUP_FILE
fi

echo "✅ Database restored successfully!"
