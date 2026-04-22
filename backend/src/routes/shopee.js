const express = require('express');
const router = express.Router();
const shopeeService = require('../services/shopeeService');
const Product = require('../models/Product');

// Test Shopee API connection
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await shopeeService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Shopee API connected' : 'Shopee API connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get shop information
router.get('/shop-info', async (req, res) => {
  try {
    const shopInfo = await shopeeService.getShopInfo();
    res.json({
      success: true,
      data: shopInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync products from Shopee
router.post('/sync-products', async (req, res) => {
  try {
    console.log('🔄 Starting product sync from Shopee...');
    
    // Get item list from Shopee
    const itemListResponse = await shopeeService.getItemList();
    
    if (!itemListResponse || itemListResponse.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch items from Shopee',
        details: itemListResponse
      });
    }

    const itemIds = itemListResponse.response?.item || [];
    
    if (itemIds.length === 0) {
      return res.json({
        success: true,
        message: 'No items found in Shopee shop',
        synced: 0
      });
    }

    // Get detailed info for items
    const itemDetails = await shopeeService.getItemBaseInfo(
      itemIds.map(item => item.item_id)
    );

    // Save/update products in database
    let syncedCount = 0;
    const errors = [];

    for (const item of itemDetails.response?.item_list || []) {
      try {
        await Product.findOneAndUpdate(
          { 'shopee.itemId': item.item_id },
          {
            name: item.item_name,
            description: item.description,
            sku: item.item_sku || `SHOPEE-${item.item_id}`,
            price: item.price_info?.[0]?.original_price || 0,
            shopee: {
              productId: item.item_id.toString(),
              itemId: item.item_id,
              stock: item.stock_info?.[0]?.normal_stock || 0,
              price: item.price_info?.[0]?.original_price || 0,
              status: item.item_status,
              lastSyncedAt: new Date()
            },
            images: item.image?.image_url_list || []
          },
          { upsert: true, new: true }
        );
        syncedCount++;
      } catch (err) {
        errors.push({ item_id: item.item_id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} products from Shopee`,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update stock in Shopee
router.post('/update-stock/:productId', async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    if (!product.shopee?.itemId) {
      return res.status(400).json({
        success: false,
        error: 'Product not linked to Shopee'
      });
    }

    const result = await shopeeService.updateStock(product.shopee.itemId, stock);

    // Update local database
    product.shopee.stock = stock;
    product.shopee.lastSyncedAt = new Date();
    await product.save();

    res.json({
      success: true,
      message: 'Stock updated in Shopee',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
