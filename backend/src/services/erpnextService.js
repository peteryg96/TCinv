const axios = require('axios');

class ERPNextService {
  constructor() {
    this.baseURL = process.env.ERPNEXT_URL || 'https://your-erpnext-instance.com';
    this.apiKey = process.env.ERPNEXT_API_KEY;
    this.apiSecret = process.env.ERPNEXT_API_SECRET;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('ERPNext API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ==================== ITEM MANAGEMENT ====================

  /**
   * Create or update an item in ERPNext
   * @param {Object} product - Product object from local database
   * @returns {Promise<Object>} Created/Updated item data
   */
  async syncItem(product) {
    try {
      // Check if item exists
      const existingItem = await this.getItem(product.sku);
      
      if (existingItem) {
        // Update existing item
        return await this.updateItem(product.sku, product);
      } else {
        // Create new item
        return await this.createItem(product);
      }
    } catch (error) {
      console.error(`Error syncing item ${product.sku}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new item in ERPNext
   * @param {Object} product - Product object
   * @returns {Promise<Object>} Created item data
   */
  async createItem(product) {
    try {
      const itemData = {
        doctype: 'Item',
        item_code: product.sku,
        item_name: product.name,
        description: product.description || product.name,
        item_group: product.category || 'Products',
        stock_uom: 'Nos',
        is_stock_item: 1,
        is_sales_item: 1,
        is_purchase_item: 1,
        opening_stock: product.totalStock || 0,
        valuation_rate: product.cost || 0,
        standard_rate: product.price || 0,
        has_variants: 0,
        custom_shopee_enabled: product.shopee?.status === 'active' ? 1 : 0,
        custom_lazada_enabled: product.lazada?.status === 'active' ? 1 : 0,
        custom_tiktok_enabled: product.tiktok?.status === 'active' ? 1 : 0
      };

      const response = await this.client.post('/api/resource/Item', itemData);
      console.log(`✅ Item created in ERPNext: ${product.sku}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`Item ${product.sku} already exists, updating instead...`);
        return await this.updateItem(product.sku, product);
      }
      throw error;
    }
  }

  /**
   * Get item details from ERPNext
   * @param {String} itemCode - Item code/SKU
   * @returns {Promise<Object>} Item data
   */
  async getItem(itemCode) {
    try {
      const response = await this.client.get(`/api/resource/Item/${itemCode}`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update existing item in ERPNext
   * @param {String} itemCode - Item code/SKU
   * @param {Object} product - Product object with updated data
   * @returns {Promise<Object>} Updated item data
   */
  async updateItem(itemCode, product) {
    try {
      const updateData = {
        item_name: product.name,
        description: product.description || product.name,
        standard_rate: product.price || 0,
        custom_shopee_enabled: product.shopee?.status === 'active' ? 1 : 0,
        custom_lazada_enabled: product.lazada?.status === 'active' ? 1 : 0,
        custom_tiktok_enabled: product.tiktok?.status === 'active' ? 1 : 0
      };

      const response = await this.client.put(
        `/api/resource/Item/${itemCode}`,
        updateData
      );
      
      console.log(`✅ Item updated in ERPNext: ${itemCode}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${itemCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete item from ERPNext
   * @param {String} itemCode - Item code/SKU
   * @returns {Promise<Object>} Delete response
   */
  async deleteItem(itemCode) {
    try {
      const response = await this.client.delete(`/api/resource/Item/${itemCode}`);
      console.log(`✅ Item deleted from ERPNext: ${itemCode}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting item ${itemCode}:`, error.message);
      throw error;
    }
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Update item stock in ERPNext using Stock Entry
   * @param {String} itemCode - Item code/SKU
   * @param {Number} quantity - Quantity to add/remove
   * @param {String} warehouse - Warehouse name
   * @param {String} type - 'Material Receipt' or 'Material Issue'
   * @returns {Promise<Object>} Stock entry data
   */
  async updateItemStock(itemCode, quantity, warehouse = 'Stores - COMP', type = 'Material Receipt') {
    try {
      // Validate quantity
      if (type === 'Material Issue' && quantity < 0) {
        quantity = Math.abs(quantity);
      }

      const stockEntryData = {
        doctype: 'Stock Entry',
        stock_entry_type: type,
        company: 'Your Company', // Update with your company name
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0],
        items: [
          {
            item_code: itemCode,
            qty: quantity,
            basic_rate: 0,
            t_warehouse: type === 'Material Receipt' ? warehouse : null,
            s_warehouse: type === 'Material Issue' ? warehouse : null
          }
        ]
      };

      // Create stock entry
      const response = await this.client.post('/api/resource/Stock Entry', stockEntryData);
      const stockEntryName = response.data.data.name;

      // Submit the stock entry
      await this.client.put(`/api/resource/Stock Entry/${stockEntryName}`, {
        docstatus: 1
      });

      console.log(`✅ Stock updated in ERPNext: ${itemCode} (${quantity})`);
      return response.data;
    } catch (error) {
      console.error(`Error updating stock for ${itemCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Get item stock levels across warehouses
   * @param {String} itemCode - Item code/SKU
   * @returns {Promise<Array>} Stock levels by warehouse
   */
  async getItemStock(itemCode) {
    try {
      const response = await this.client.get('/api/resource/Bin', {
        params: {
          filters: JSON.stringify([['item_code', '=', itemCode]]),
          fields: JSON.stringify([
            'warehouse',
            'actual_qty',
            'reserved_qty',
            'ordered_qty',
            'planned_qty',
            'projected_qty'
          ])
        }
      });

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching stock for ${itemCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Get total stock across all warehouses
   * @param {String} itemCode - Item code/SKU
   * @returns {Promise<Number>} Total stock quantity
   */
  async getTotalStock(itemCode) {
    try {
      const stockData = await this.getItemStock(itemCode);
      const totalStock = stockData.reduce((sum, bin) => sum + (bin.actual_qty || 0), 0);
      return totalStock;
    } catch (error) {
      console.error(`Error calculating total stock for ${itemCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync inventory from local database to ERPNext
   * @param {Array} products - Array of products with stock data
   * @returns {Promise<Object>} Sync results
   */
  async syncInventoryToERPNext(products) {
    const results = {
      success: [],
      failed: []
    };

    for (const product of products) {
      try {
        // Ensure item exists
        await this.syncItem(product);

        // Get current stock in ERPNext
        const currentStock = await this.getTotalStock(product.sku);
        const targetStock = product.totalStock || 0;
        const difference = targetStock - currentStock;

        if (difference !== 0) {
          const type = difference > 0 ? 'Material Receipt' : 'Material Issue';
          await this.updateItemStock(
            product.sku,
            Math.abs(difference),
            'Stores - COMP',
            type
          );
        }

        results.success.push({
          sku: product.sku,
          currentStock,
          targetStock,
          difference
        });
      } catch (error) {
        results.failed.push({
          sku: product.sku,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Sync inventory from ERPNext to local database
   * @returns {Promise<Array>} Inventory data from ERPNext
   */
  async syncInventoryFromERPNext() {
    try {
      const response = await this.client.get('/api/resource/Bin', {
        params: {
          fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty']),
          limit_page_length: 0
        }
      });

      // Group by item_code and sum quantities
      const inventory = {};
      response.data.data.forEach(bin => {
        if (!inventory[bin.item_code]) {
          inventory[bin.item_code] = 0;
        }
        inventory[bin.item_code] += bin.actual_qty || 0;
      });

      return Object.entries(inventory).map(([sku, stock]) => ({
        sku,
        stock
      }));
    } catch (error) {
      console.error('Error syncing inventory from ERPNext:', error.message);
      throw error;
    }
  }

  // ==================== SALES ORDER MANAGEMENT ====================

  /**
   * Create sales order from marketplace order
   * @param {Object} order - Order object from marketplace
   * @returns {Promise<Object>} Created sales order
   */
  async createSalesOrder(order) {
    try {
      // Ensure customer exists
      let customer = await this.getCustomer(order.customerEmail);
      if (!customer) {
        customer = await this.createCustomer({
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone
        });
      }

      const salesOrderData = {
        doctype: 'Sales Order',
        customer: customer.name,
        order_type: 'Sales',
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        items: order.items.map(item => ({
          item_code: item.sku,
          qty: item.quantity,
          rate: item.price,
          warehouse: 'Stores - COMP'
        })),
        // Custom fields for marketplace integration
        custom_marketplace: order.platform, // 'Shopee', 'Lazada', or 'TikTok'
        custom_marketplace_order_id: order.platformOrderId,
        custom_marketplace_order_date: order.orderDate,
        custom_shipping_address: order.shippingAddress
      };

      // Create sales order
      const response = await this.client.post(
        '/api/resource/Sales Order',
        salesOrderData
      );
      const salesOrderName = response.data.data.name;

      // Submit the sales order
      await this.client.put(`/api/resource/Sales Order/${salesOrderName}`, {
        docstatus: 1
      });

      console.log(`✅ Sales Order created: ${salesOrderName}`);
      return response.data;
    } catch (error) {
      console.error('Error creating sales order:', error.message);
      throw error;
    }
  }

  /**
   * Get sales order details
   * @param {String} salesOrderName - Sales Order name
   * @returns {Promise<Object>} Sales order data
   */
  async getSalesOrder(salesOrderName) {
    try {
      const response = await this.client.get(
        `/api/resource/Sales Order/${salesOrderName}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching sales order ${salesOrderName}:`, error.message);
      throw error;
    }
  }

  /**
   * Update sales order status
   * @param {String} salesOrderName - Sales Order name
   * @param {String} status - New status
   * @returns {Promise<Object>} Updated sales order
   */
  async updateSalesOrderStatus(salesOrderName, status) {
    try {
      const response = await this.client.put(
        `/api/resource/Sales Order/${salesOrderName}`,
        { status }
      );
      console.log(`✅ Sales Order ${salesOrderName} status updated to ${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating sales order status:`, error.message);
      throw error;
    }
  }

  // ==================== CUSTOMER MANAGEMENT ====================

  /**
   * Get customer by email
   * @param {String} email - Customer email
   * @returns {Promise<Object|null>} Customer data or null
   */
  async getCustomer(email) {
    try {
      const response = await this.client.get('/api/resource/Customer', {
        params: {
          filters: JSON.stringify([['email_id', '=', email]]),
          fields: JSON.stringify(['name', 'customer_name', 'customer_group', 'email_id'])
        }
      });

      if (response.data.data.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new customer
   * @param {Object} customerData - Customer details
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const customer = {
        doctype: 'Customer',
        customer_name: customerData.name || 'Walk-In Customer',
        customer_type: 'Individual',
        customer_group: 'Individual',
        territory: 'All Territories',
        email_id: customerData.email || null,
        mobile_no: customerData.phone || null
      };

      const response = await this.client.post('/api/resource/Customer', customer);
      console.log(`✅ Customer created: ${response.data.data.name}`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 409) {
        // Customer already exists, fetch and return
        return await this.getCustomer(customerData.email);
      }
      console.error('Error creating customer:', error.message);
      throw error;
    }
  }

  /**
   * Update customer details
   * @param {String} customerName - Customer name in ERPNext
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(customerName, updateData) {
    try {
      const response = await this.client.put(
        `/api/resource/Customer/${customerName}`,
        updateData
      );
      console.log(`✅ Customer updated: ${customerName}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating customer ${customerName}:`, error.message);
      throw error;
    }
  }

  // ==================== PURCHASE ORDER MANAGEMENT ====================

  /**
   * Create purchase order for restocking
   * @param {Array} items - Items to order
   * @param {String} supplier - Supplier name
   * @returns {Promise<Object>} Created purchase order
   */
  async createPurchaseOrder(items, supplier = 'Default Supplier') {
    try {
      const purchaseOrderData = {
        doctype: 'Purchase Order',
        supplier: supplier,
        schedule_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        items: items.map(item => ({
          item_code: item.sku,
          qty: item.quantity,
          rate: item.cost || 0,
          warehouse: 'Stores - COMP'
        }))
      };

      const response = await this.client.post(
        '/api/resource/Purchase Order',
        purchaseOrderData
      );
      
      console.log(`✅ Purchase Order created: ${response.data.data.name}`);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase order:', error.message);
      throw error;
    }
  }

  /**
   * Submit purchase order
   * @param {String} purchaseOrderName - Purchase Order name
   * @returns {Promise<Object>} Submitted purchase order
   */
  async submitPurchaseOrder(purchaseOrderName) {
    try {
      const response = await this.client.put(
        `/api/resource/Purchase Order/${purchaseOrderName}`,
        { docstatus: 1 }
      );
      console.log(`✅ Purchase Order submitted: ${purchaseOrderName}`);
      return response.data;
    } catch (error) {
      console.error(`Error submitting purchase order:`, error.message);
      throw error;
    }
  }

  // ==================== DELIVERY MANAGEMENT ====================

  /**
   * Create delivery note from sales order
   * @param {String} salesOrderName - Sales Order name
   * @returns {Promise<Object>} Created delivery note
   */
  async createDeliveryNote(salesOrderName) {
    try {
      // Get sales order details
      const salesOrder = await this.getSalesOrder(salesOrderName);

      const deliveryNoteData = {
        doctype: 'Delivery Note',
        customer: salesOrder.customer,
        posting_date: new Date().toISOString().split('T')[0],
        items: salesOrder.items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          warehouse: item.warehouse,
          against_sales_order: salesOrderName
        }))
      };

      const response = await this.client.post(
        '/api/resource/Delivery Note',
        deliveryNoteData
      );
      
      const deliveryNoteName = response.data.data.name;

      // Submit delivery note
      await this.client.put(`/api/resource/Delivery Note/${deliveryNoteName}`, {
        docstatus: 1
      });

      console.log(`✅ Delivery Note created: ${deliveryNoteName}`);
      return response.data;
    } catch (error) {
      console.error('Error creating delivery note:', error.message);
      throw error;
    }
  }

  // ==================== REPORTING ====================

  /**
   * Get low stock items
   * @param {Number} threshold - Stock threshold
   * @returns {Promise<Array>} Low stock items
   */
  async getLowStockItems(threshold = 10) {
    try {
      const response = await this.client.get('/api/resource/Bin', {
        params: {
          filters: JSON.stringify([['actual_qty', '<', threshold]]),
          fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty']),
          limit_page_length: 0
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error.message);
      throw error;
    }
  }

  /**
   * Get sales analytics
   * @param {String} fromDate - Start date (YYYY-MM-DD)
   * @param {String} toDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Sales analytics
   */
  async getSalesAnalytics(fromDate, toDate) {
    try {
      const response = await this.client.get('/api/resource/Sales Order', {
        params: {
          filters: JSON.stringify([
            ['transaction_date', '>=', fromDate],
            ['transaction_date', '<=', toDate],
            ['docstatus', '=', 1]
          ]),
          fields: JSON.stringify([
            'name',
            'customer',
            'transaction_date',
            'grand_total',
            'custom_marketplace'
          ]),
          limit_page_length: 0
        }
      });

      const orders = response.data.data;
      
      // Calculate analytics
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.grand_total, 0),
        byMarketplace: {},
        averageOrderValue: 0
      };

      // Group by marketplace
      orders.forEach(order => {
        const marketplace = order.custom_marketplace || 'Direct';
        if (!analytics.byMarketplace[marketplace]) {
          analytics.byMarketplace[marketplace] = {
            orders: 0,
            revenue: 0
          };
        }
        analytics.byMarketplace[marketplace].orders++;
        analytics.byMarketplace[marketplace].revenue += order.grand_total;
      });

      analytics.averageOrderValue = 
        analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

      return analytics;
    } catch (error) {
      console.error('Error fetching sales analytics:', error.message);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Test ERPNext connection
   * @returns {Promise<Boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.client.get('/api/method/ping');
      console.log('✅ ERPNext connection successful');
      return true;
    } catch (error) {
      console.error('❌ ERPNext connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get ERPNext version
   * @returns {Promise<String>} ERPNext version
   */
  async getVersion() {
    try {
      const response = await this.client.get('/api/method/version');
      return response.data.message;
    } catch (error) {
      console.error('Error fetching ERPNext version:', error.message);
      throw error;
    }
  }
}

module.exports = new ERPNextService();