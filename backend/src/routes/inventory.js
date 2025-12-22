const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get inventory summary
router.get('/summary', async (req, res) => {
  try {
    const products = await Product.find();
    
    const summary = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.totalStock, 0),
      shopeeStock: products.reduce((sum, p) => sum + (p.shopee?.stock || 0), 0),
      lazadaStock: products.reduce((sum, p) => sum + (p.lazada?.stock || 0), 0),
      tiktokStock: products.reduce((sum, p) => sum + (p.tiktok?.stock || 0), 0),
      lowStockItems: products.filter(p => p.totalStock < 10).length
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.find({ totalStock: { $lt: threshold } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;