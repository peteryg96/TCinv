# TCinv
Inventory system for online platform integration.

Made with Claude AI

# How to use
# 1. Navigate to project
cd ../TCinv

# 2. Start everything
docker-compose up -d

# 3. Wait ~30 seconds for health checks
docker-compose ps

# 4. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/api/health

# Stop services (keeps data)
docker-compose down

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Seed database
docker-compose exec backend npm run seed

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# Backup database
docker-compose exec -T mongodb mongodump \
  --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
  --archive > backup-$(date +%Y%m%d).dump

# Restore database
docker-compose exec -T mongodb mongorestore \
  --uri="mongodb://admin:password123@localhost:27017/inventory?authSource=admin" \
  --archive < backup-20241222.dump


# Backend installs
cd backend
npm install express cors mongoose dotenv axios crypto-js
npm install --save-dev nodemon
# Run
npm run dev

# Frontend installs
cd frontend
npm install react react-dom
npm install --save-dev @vitejs/plugin-react vite
npm install lucide-react
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
# Run
npm run dev

