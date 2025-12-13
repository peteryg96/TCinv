const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Your other routes here...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;