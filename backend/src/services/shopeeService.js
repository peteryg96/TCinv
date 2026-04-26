const axios = require('axios');
const crypto = require('crypto-js');

class ShopeeService {
  constructor() {
    this.environment = process.env.SHOPEE_ENV || 'test';

    if (this.environment === 'production') {
      this.partnerId = process.env.SHOPEE_PROD_PARTNER_ID;
      this.partnerKey = process.env.SHOPEE_PROD_PARTNER_KEY;
      this.shopId = process.env.SHOPEE_PROD_SHOP_ID;
      this.merchantId = process.env.SHOPEE_PROD_MERCHANT_ID;
      this.baseURL = process.env.SHOPEE_PROD_API_URL || 'https://partner.shopeemobile.com';
    } else {
      this.partnerId = process.env.SHOPEE_TEST_PARTNER_ID;
      this.partnerKey = process.env.SHOPEE_TEST_PARTNER_KEY;
      this.shopId = process.env.SHOPEE_TEST_SHOP_ID;
      this.merchantId = process.env.SHOPEE_TEST_MERCHANT_ID;
      this.baseURL = process.env.SHOPEE_TEST_API_URL || 'https://partner.test-stable.shopeemobile.com';
    }

    this.redirectUrl = process.env.SHOPEE_REDIRECT_URL;
    this.webhookSecret = process.env.SHOPEE_WEBHOOK_SECRET;

    console.log(`🔧 Shopee Service initialized in ${this.environment.toUpperCase()} mode`);
  }

  isConfigured() {
    return !!(this.partnerId && this.partnerKey);
  }

  // Used for public endpoints (auth, getAuthorizationUrl)
  generateSignature(path, timestamp) {
    const baseString = `${this.partnerId}${path}${timestamp}`;
    return crypto.HmacSHA256(baseString, this.partnerKey).toString();
  }

  // Used for shop-level authenticated endpoints
  generateAuthSignature(path, timestamp, accessToken, shopId) {
    const baseString = `${this.partnerId}${path}${timestamp}${accessToken}${shopId}`;
    return crypto.HmacSHA256(baseString, this.partnerKey).toString();
  }

  // Base query params shared by all authenticated requests
  _authParams(path, accessToken) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateAuthSignature(path, timestamp, accessToken, parseInt(this.shopId));
    return {
      partner_id:   parseInt(this.partnerId),
      shop_id:      parseInt(this.shopId),
      access_token: accessToken,
      timestamp,
      sign
    };
  }

  // For POST endpoints (product write operations, shop info, etc.)
  async makePostRequest(path, body = {}, accessToken = null) {
    try {
      if (!this.isConfigured()) throw new Error(`Shopee ${this.environment} credentials not configured`);

      const timestamp = Math.floor(Date.now() / 1000);
      const sign = accessToken
        ? this.generateAuthSignature(path, timestamp, accessToken, parseInt(this.shopId))
        : this.generateSignature(path, timestamp);

      const params = { partner_id: parseInt(this.partnerId), timestamp, sign };
      if (accessToken) {
        params.access_token = accessToken;
        params.shop_id = parseInt(this.shopId);
      }

      console.log(`📡 Shopee API [${this.environment}]: POST ${path}`);

      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}${path}`,
        params,
        data: body,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (response.data.error && response.data.error !== '') {
        console.error('❌ Shopee API Error:', response.data);
        throw new Error(response.data.message || 'Shopee API error');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Shopee API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // For GET endpoints (product read operations)
  async makeGetRequest(path, extraParams = {}, accessToken = null) {
    try {
      if (!this.isConfigured()) throw new Error(`Shopee ${this.environment} credentials not configured`);

      const timestamp = Math.floor(Date.now() / 1000);
      const sign = accessToken
        ? this.generateAuthSignature(path, timestamp, accessToken, parseInt(this.shopId))
        : this.generateSignature(path, timestamp);

      const params = {
        partner_id: parseInt(this.partnerId),
        timestamp,
        sign,
        ...extraParams
      };

      if (accessToken) {
        params.access_token = accessToken;
        params.shop_id = parseInt(this.shopId);
      }

      console.log(`📡 Shopee API [${this.environment}]: GET ${path}`);

      const response = await axios({
        method: 'GET',
        url: `${this.baseURL}${path}`,
        params,
        timeout: 30000
      });

      if (response.data.error && response.data.error !== '') {
        console.error('❌ Shopee API Error:', response.data);
        throw new Error(response.data.message || 'Shopee API error');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Shopee API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Keep makeRequest as alias for POST for backwards compatibility
  async makeRequest(path, body = {}, method = 'POST', accessToken = null) {
    if (method === 'GET') return this.makeGetRequest(path, body, accessToken);
    return this.makePostRequest(path, body, accessToken);
  }

  // ========== Category Management ==========

  async getCategoryList(accessToken, language = 'en') {
    try {
      const path = '/api/v2/product/get_category';
      return await this.makeGetRequest(path, { language }, accessToken);
    } catch (error) {
      console.error('Error getting category list:', error.message);
      throw error;
    }
  }

  async getAttributes(accessToken, categoryId, language = 'en') {
    try {
      const path = '/api/v2/product/get_attributes';
      return await this.makeGetRequest(path, { category_id: categoryId, language }, accessToken);
    } catch (error) {
      console.error('Error getting attributes:', error.message);
      throw error;
    }
  }

  async getBrandList(accessToken, categoryId, page = 1, pageSize = 100) {
    try {
      const path = '/api/v2/product/get_brand_list';
      return await this.makeGetRequest(path, {
        category_id: categoryId,
        offset:      (page - 1) * pageSize,
        page_size:   pageSize,
        status:      1
      }, accessToken);
    } catch (error) {
      console.error('Error getting brand list:', error.message);
      throw error;
    }
  }

  // ========== Product Management ==========

  async addProduct(accessToken, productData) {
    try {
      const path = '/api/v2/product/add_item';
      const body = {
        original_price: productData.price,
        description:    productData.description,
        weight:         productData.weight || 0,
        item_name:      productData.name,
        item_status:    productData.status || 'NORMAL',
        dimension: {
          package_length: productData.dimensions?.length || 0,
          package_width:  productData.dimensions?.width  || 0,
          package_height: productData.dimensions?.height || 0
        },
        normal_stock:    productData.stock || 0,
        category_id:     productData.categoryId,
        image:           { image_id_list: productData.imageIds || [] },
        attribute_list:  productData.attributes || [],
        logistic_info:   productData.logisticInfo || [],
        ...(productData.brand     && { brand:     { brand_id: productData.brand.id } }),
        ...(productData.condition && { condition: productData.condition })
      };

      const response = await this.makePostRequest(path, body, accessToken);
      console.log(`✅ Product added to Shopee:`, response);
      return response;
    } catch (error) {
      console.error('Error adding product:', error.message);
      throw error;
    }
  }

  async updateProduct(accessToken, itemId, updates) {
    try {
      const path = '/api/v2/product/update_item';
      const response = await this.makePostRequest(path, { item_id: itemId, ...updates }, accessToken);
      console.log(`✅ Product updated in Shopee: ${itemId}`);
      return response;
    } catch (error) {
      console.error(`Error updating product ${itemId}:`, error.message);
      throw error;
    }
  }

  async deleteProduct(accessToken, itemId) {
    try {
      const path = '/api/v2/product/delete_item';
      const response = await this.makePostRequest(path, { item_id: itemId }, accessToken);
      console.log(`✅ Product deleted from Shopee: ${itemId}`);
      return response;
    } catch (error) {
      console.error(`Error deleting product ${itemId}:`, error.message);
      throw error;
    }
  }

  async unlistProduct(accessToken, itemIdList) {
    try {
      const path = '/api/v2/product/unlist_item';
      const body = {
        item_list: itemIdList.map(id => ({ item_id: id, unlist: true }))
      };
      const response = await this.makePostRequest(path, body, accessToken);
      console.log(`✅ Products unlisted from Shopee`);
      return response;
    } catch (error) {
      console.error('Error unlisting products:', error.message);
      throw error;
    }
  }

  async getItemList(accessToken, offset = 0, pageSize = 50, itemStatus = 'NORMAL') {
    try {
      const path = '/api/v2/product/get_item_list';
      return await this.makeGetRequest(path, {
        offset,
        page_size:   pageSize,
        item_status: itemStatus
      }, accessToken);
    } catch (error) {
      console.error('Error getting item list:', error.message);
      throw error;
    }
  }

  async getItemBaseInfo(accessToken, itemIdList) {
    try {
      const path = '/api/v2/product/get_item_base_info';
      const response = await this.makeGetRequest(path, {
        item_id_list:          itemIdList.join(','),
        need_tax_info:         false,
        need_complaint_policy: false
      }, accessToken);
      console.log('📦 getItemBaseInfo:', JSON.stringify(response, null, 2)); // temp
      return response;
    } catch (error) {
      console.error('Error getting item base info:', error.message);
      throw error;
    }
  }

  async getModelList(accessToken, itemId) {
    try {
      const path = '/api/v2/product/get_model_list';
      const response = await this.makeGetRequest(path, { item_id: itemId }, accessToken);
      console.log('📦 getModelList:', JSON.stringify(response, null, 2)); // temp
      return response;
    } catch (error) {
      console.error('Error getting model list:', error.message);
      throw error;
    }
  }

  // ========== Stock & Price Management ==========

  async updateStock(accessToken, itemId, stockList) {
    try {
      const path = '/api/v2/product/update_stock';
      const response = await this.makePostRequest(path, {
        item_id:    itemId,
        stock_list: stockList
      }, accessToken);
      console.log(`✅ Updated stock for item ${itemId}`);
      return response;
    } catch (error) {
      console.error(`Error updating stock for item ${itemId}:`, error.message);
      throw error;
    }
  }

  async updatePrice(accessToken, itemId, priceList) {
    try {
      const path = '/api/v2/product/update_price';
      const response = await this.makePostRequest(path, {
        item_id:    itemId,
        price_list: priceList
      }, accessToken);
      console.log(`✅ Updated price for item ${itemId}`);
      return response;
    } catch (error) {
      console.error(`Error updating price for item ${itemId}:`, error.message);
      throw error;
    }
  }

  // ========== Image Management ==========

  async uploadImage(accessToken, imageFile) {
    try {
      const path = '/api/v2/media_space/upload_image';
      console.log('Image upload not yet implemented');
      throw new Error('Image upload not yet implemented');
    } catch (error) {
      console.error('Error uploading image:', error.message);
      throw error;
    }
  }

  // ========== OAuth & Auth ==========

  getAuthorizationUrl() {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.generateSignature(path, timestamp);
    const redirectEncoded = encodeURIComponent(this.redirectUrl);
    return `${this.baseURL}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${redirectEncoded}`;
  }

  async getAccessToken(code, shopId) {
    try {
      const path = '/api/v2/auth/token/get';
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);

      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}${path}`,
        params: { partner_id: parseInt(this.partnerId), timestamp, sign },
        data:   { code, shop_id: parseInt(shopId), partner_id: parseInt(this.partnerId) }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error.message);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken, shopId) {
    try {
      const path = '/api/v2/auth/access_token/get';
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);

      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}${path}`,
        params: { partner_id: parseInt(this.partnerId), timestamp, sign },
        data:   { refresh_token: refreshToken, shop_id: parseInt(shopId), partner_id: parseInt(this.partnerId) }
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error.message);
      throw error;
    }
  }

  async getShopInfo(accessToken) {
    try {
      const path = '/api/v2/shop/get_shop_info';
      return await this.makeGetRequest(path, {}, accessToken);
    } catch (error) {
      console.error('Error getting shop info:', error.message);
      throw error;
    }
  }

  verifyWebhookSignature(url, body, authorization) {
    const baseString = `${url}|${JSON.stringify(body)}`;
    const expectedSignature = crypto.HmacSHA256(baseString, this.partnerKey).toString();
    return authorization === expectedSignature;
  }

  getEnvironmentInfo() {
    return {
      environment: this.environment,
      baseURL:     this.baseURL,
      configured:  this.isConfigured()
    };
  }

  async testConnection() {
    try {
      console.log('🔍 Testing Shopee API connection...');
      if (!this.isConfigured()) {
        return {
          success:     false,
          message:     `Shopee ${this.environment} credentials not configured`,
          environment: this.environment,
          configured:  false
        };
      }
      return {
        success:     true,
        message:     `Shopee ${this.environment} credentials configured`,
        environment: this.environment,
        apiUrl:      this.baseURL,
        configured:  true,
        note:        'OAuth authorization required for API calls. Use /api/shopee/auth/url to get started.'
      };
    } catch (error) {
      return { success: false, message: error.message, environment: this.environment };
    }
  }
}

module.exports = new ShopeeService();
