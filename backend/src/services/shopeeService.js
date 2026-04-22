const axios = require('axios');
const crypto = require('crypto-js');

class ShopeeService {
  constructor() {
    this.partnerId = process.env.SHOPEE_PARTNER_ID;
    this.partnerKey = process.env.SHOPEE_PARTNER_KEY;
    this.shopId = process.env.SHOPEE_SHOP_ID;
    this.baseURL = process.env.SHOPEE_API_URL || 'https://partner.shopeemobile.com';
  }

  /**
   * Generate Shopee API signature
   * @param {string} path - API path
   * @param {number} timestamp - Unix timestamp
   * @returns {string} HMAC-SHA256 signature
   */
  generateSignature(path, timestamp) {
    const baseString = `${this.partnerId}${path}${timestamp}`;
    const sign = crypto.HmacSHA256(baseString, this.partnerKey).toString();
    return sign;
  }

  /**
   * Make authenticated request to Shopee API
   * @param {string} path - API endpoint path
   * @param {object} body - Request body
   * @param {string} method - HTTP method (GET/POST)
   * @returns {Promise<object>} API response
   */
  async makeRequest(path, body = {}, method = 'POST') {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);
      
      const url = `${this.baseURL}${path}`;
      const params = {
        partner_id: parseInt(this.partnerId),
        timestamp,
        sign,
        shop_id: parseInt(this.shopId)
      };

      console.log(`📡 Shopee API Request: ${method} ${path}`);

      const response = await axios({
        method,
        url,
        params,
        data: body,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Shopee API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get shop information
   * @returns {Promise<object>} Shop details
   */
  async getShopInfo() {
    try {
      const path = '/api/v2/shop/get_shop_info';
      const response = await this.makeRequest(path, {}, 'GET');
      return response;
    } catch (error) {
      console.error('Error getting shop info:', error.message);
      throw error;
    }
  }

  /**
   * Get item list from Shopee
   * @param {number} offset - Pagination offset
   * @param {number} pageSize - Items per page
   * @returns {Promise<object>} Item list
   */
  async getItemList(offset = 0, pageSize = 50) {
    try {
      const path = '/api/v2/product/get_item_list';
      const body = {
        offset,
        page_size: pageSize,
        item_status: ['NORMAL'] // Only get active items
      };
      
      const response = await this.makeRequest(path, body);
      return response;
    } catch (error) {
      console.error('Error getting item list:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed item information
   * @param {array} itemIdList - Array of item IDs
   * @returns {Promise<object>} Item details
   */
  async getItemBaseInfo(itemIdList) {
    try {
      const path = '/api/v2/product/get_item_base_info';
      const body = {
        item_id_list: itemIdList
      };
      
      const response = await this.makeRequest(path, body);
      return response;
    } catch (error) {
      console.error('Error getting item base info:', error.message);
      throw error;
    }
  }

  /**
   * Update item stock
   * @param {number} itemId - Shopee item ID
   * @param {number} stock - New stock quantity
   * @returns {Promise<object>} Update response
   */
  async updateStock(itemId, stock) {
    try {
      const path = '/api/v2/product/update_stock';
      const body = {
        item_id: itemId,
        stock_list: [
          {
            model_id: 0, // 0 for items without variations
            normal_stock: stock
          }
        ]
      };
      
      const response = await this.makeRequest(path, body);
      console.log(`✅ Updated stock for item ${itemId} to ${stock}`);
      return response;
    } catch (error) {
      console.error(`Error updating stock for item ${itemId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update item price
   * @param {number} itemId - Shopee item ID
   * @param {number} price - New price
   * @returns {Promise<object>} Update response
   */
  async updatePrice(itemId, price) {
    try {
      const path = '/api/v2/product/update_price';
      const body = {
        item_id: itemId,
        price_list: [
          {
            model_id: 0, // 0 for items without variations
            original_price: price
          }
        ]
      };
      
      const response = await this.makeRequest(path, body);
      console.log(`✅ Updated price for item ${itemId} to ${price}`);
      return response;
    } catch (error) {
      console.error(`Error updating price for item ${itemId}:`, error.message);
      throw error;
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('🔍 Testing Shopee API connection...');
      const shopInfo = await this.getShopInfo();
      
      if (shopInfo && !shopInfo.error) {
        console.log('✅ Shopee API connection successful');
        return true;
      } else {
        console.log('❌ Shopee API connection failed:', shopInfo.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Shopee API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = new ShopeeService();
