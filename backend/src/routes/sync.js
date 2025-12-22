const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Simulate sync with marketplaces
router.post('/all', async (req, res) => {
  try {
    // In production, this would call actual Shopee, Lazada, TikTok APIs
    const products = await Product.find();
    
    const results = {
      success: true,
      synced: products.length,
      timestamp: new Date().toISOString()
    };

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync single product
router.post('/product/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Simulate API calls to marketplaces
    const results = {
      success: true,
      product: product.sku,
      platforms: {
        shopee: product.shopee?.status === 'active',
        lazada: product.lazada?.status === 'active',
        tiktok: product.tiktok?.status === 'active'
      }
    };

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;