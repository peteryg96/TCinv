# Test health check
curl http://localhost:5000/api/health

# Test products endpoint
curl http://localhost:5000/api/products

# Test through frontend proxy
curl http://localhost:3000/api/products

# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f backend

# Start services
docker-compose up -d

# Stop services (containers remain)
docker-compose stop

# Start stopped services
docker-compose start

# Restart services
docker-compose restart

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove everything including volumes (⚠️ deletes data)
docker-compose down -v

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend npm run seed
docker-compose exec mongodb mongosh -u admin -p password123

# Scale services (not applicable for this setup, but good to know)
docker-compose up -d --scale backend=2