const express = require('express');
const router = express.Router();
const shopeeService = require('../services/shopeeService');
const ShopeeToken = require('../models/ShopeeToken');
const Product = require('../models/Product');
const shopeeAuth = require('../middleware/shopeeAuth');

// Get environment info
router.get('/environment', (req, res) => {
  const envInfo = shopeeService.getEnvironmentInfo();
  res.json({
    success: true,
    data: envInfo
  });
});

// Test Shopee API connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await shopeeService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get authorization URL for OAuth flow
router.get('/auth/url', (req, res) => {
  try {
    if (!shopeeService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Shopee credentials not configured'
      });
    }

    const authUrl = shopeeService.getAuthorizationUrl();
    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authorize'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// OAuth callback handler
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, shop_id } = req.query;
    const env = shopeeService.environment; // 'test' or 'production'

    if (!code || !shop_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or shop_id'
      });
    }

    const tokenResponse = await shopeeService.getAccessToken(code, shop_id);

    if (tokenResponse.error) {
      return res.status(400).json({
        success: false,
        error: tokenResponse.message
      });
    }

    try {
      const result = await ShopeeToken.findOneAndUpdate(
        { shopId: parseInt(shop_id) },
        {
          [`${env}.accessToken`]:  tokenResponse.access_token,
          [`${env}.refreshToken`]: tokenResponse.refresh_token,
          [`${env}.expiresAt`]:    new Date(Date.now() + tokenResponse.expire_in * 1000),
          [`${env}.updatedAt`]:    new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Tokens saved for shop ${shop_id} in ${env} environment`);
    } catch (dbErr) {
      console.error('❌ Failed to save tokens to DB:', dbErr.message);
      return res.status(500).json({
        success: false,
        error: 'Authorization succeeded but failed to save tokens: ' + dbErr.message
      });
    }

    res.json({
      success: true,
      message: `Tokens saved for ${env} environment.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get shop information — token loaded automatically by middleware
router.post('/shop-info', shopeeAuth, async (req, res) => {
  try {
    const shopInfo = await shopeeService.getShopInfo(req.accessToken);
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

// Sync products from Shopee — token loaded automatically by middleware
router.post('/sync-products', shopeeAuth, async (req, res) => {
  try {
    console.log('🔄 Starting product sync from Shopee...');

    const itemListResponse = await shopeeService.getItemList(req.accessToken);

    if (!itemListResponse || itemListResponse.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch items from Shopee',
        details: itemListResponse
      });
    }

    const items = itemListResponse.response?.item || [];

    if (items.length === 0) {
      return res.json({
        success: true,
        message: 'No items found in Shopee shop',
        synced: 0
      });
    }

    const itemIds = items.map(item => item.item_id);

    // Shopee limits to 50 items per request
    const chunks = [];
    for (let i = 0; i < itemIds.length; i += 50) {
      chunks.push(itemIds.slice(i, i + 50));
    }

    let syncedCount = 0;
    const errors = [];

    for (const chunk of chunks) {
      try {
        const itemDetails = await shopeeService.getItemBaseInfo(req.accessToken, chunk);

        for (const item of itemDetails.response?.item_list || []) {
          try {
            let price = 0;
            let stock = 0;

            if (item.has_model) {
            const modelData = await shopeeService.getModelList(req.accessToken, item.item_id);
            const models = modelData.response?.model || [];

            // Stock is in stock_info_v2, price is already in MYR (no division needed)
            stock = models.reduce((sum, m) => 
              sum + (m.stock_info_v2?.summary_info?.total_available_stock || 0), 0);
            
            const prices = models.map(m => m.price_info?.[0]?.original_price || 0).filter(p => p > 0);
            price = prices.length > 0 ? Math.min(...prices) : 0;
            } else {
              // Non-model items — price may still need dividing, confirm when you test a non-model item
              price = (item.price_info?.[0]?.original_price || 0) / 100000;
              stock = item.stock_info?.[0]?.normal_stock || 0;
            }

            await Product.findOneAndUpdate(
              { 'shopee.itemId': item.item_id },
              {
                name:        item.item_name,
                description: item.description_info?.extended_description?.field_list
                              ?.find(f => f.field_type === 'text')?.text || '',
                sku:         item.item_sku || `SHOPEE-${item.item_id}`,
                price,
                shopee: {
                  productId:    item.item_id.toString(),
                  itemId:       item.item_id,
                  categoryId:   item.category_id,
                  stock,
                  price,
                  status:       item.item_status,
                  condition:    item.condition,
                  weight:       parseFloat(item.weight) || 0,
                  packageLength: item.dimension?.package_length || 0,
                  packageWidth:  item.dimension?.package_width  || 0,
                  packageHeight: item.dimension?.package_height || 0,
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
      } catch (err) {
        errors.push({ chunk, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} products from Shopee`,
      synced: syncedCount,
      total: itemIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update stock in Shopee — token loaded automatically by middleware
router.post('/update-stock/:productId', shopeeAuth, async (req, res) => {
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

    const result = await shopeeService.updateStock(req.accessToken, product.shopee.itemId, stock);

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

// Webhook handler for Shopee events
router.post('/webhook', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;

    const isValid = shopeeService.verifyWebhookSignature(url, req.body, authorization);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    console.log('📩 Shopee Webhook received:', req.body);

    const { code, data } = req.body;

    switch (code) {
      case 0: // Order update
        console.log('Order update:', data);
        // TODO: Handle order update
        break;
      case 1: // Product update
        console.log('Product update:', data);
        // TODO: Handle product update
        break;
      default:
        console.log('Unknown webhook event:', code);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
