const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthcheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Routes
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const syncRoutes = require('./routes/sync');
const erpnextRoutes = require('./routes/erpnext');

app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/erpnext', erpnextRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/inventory?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
      console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
    });
  });
}

module.exports = app;