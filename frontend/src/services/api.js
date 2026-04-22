const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async updateShopeeStock(id, stock) {
    return this.request(`/products/${id}/shopee/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Shopee
  async testShopeeConnection() {
    return this.request('/shopee/test-connection');
  }

  async getShopeeShopInfo() {
    return this.request('/shopee/shop-info');
  }

  async syncShopeeProducts() {
    return this.request('/shopee/sync-products', {
      method: 'POST',
    });
  }

  async updateShopeeStock(productId, stock) {
    return this.request(`/shopee/update-stock/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ stock }),
    });
  }
}

export default new ApiService();
