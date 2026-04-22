import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Plus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from './services/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load products on mount
  useEffect(() => {
    if (backendStatus === 'connected') {
      loadProducts();
    }
  }, [backendStatus]);

  const checkBackendHealth = async () => {
    try {
      const response = await api.checkHealth();
      if (response.status === 'ok') {
        setBackendStatus('connected');
        setError(null);
      }
    } catch (err) {
      setBackendStatus('disconnected');
      setError('Cannot connect to backend server. Make sure it is running on port 5000.');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProducts();
      setProducts(response.data || []);
    } catch (err) {
      setError('Failed to load products: ' + err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncShopee = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      
      const response = await api.syncShopeeProducts();
      
      if (response.success) {
        setSuccess(response.message);
        await loadProducts();
      } else {
        setError('Sync failed: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to sync with Shopee: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      await api.updateShopeeStock(productId, parseInt(newStock));
      await loadProducts();
      setSuccess('Stock updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update stock: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      await loadProducts();
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  if (backendStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (backendStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Backend Disconnected</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={checkBackendHealth}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Shopee Inventory Manager</h1>
            </div>
            <button
              onClick={handleSyncShopee}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Shopee'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock (Shopee)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.reduce((sum, p) => sum + (p.shopee?.stock || 0), 0)}
                </p>
              </div>
              <Package className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => (p.shopee?.stock || 0) < 10).length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No products found</p>
              <button
                onClick={handleSyncShopee}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Sync from Shopee
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shopee Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        RM {product.shopee?.price || product.price}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={product.shopee?.stock || 0}
                          onChange={(e) => handleStockUpdate(product._id, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.shopee?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.shopee?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
