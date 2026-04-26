import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Plus, Trash2, Edit2, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react';
import api from './services/api';
import ProductForm from './components/ProductForm';
import ProductEditModal from './components/ProductEditModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import SearchBar from './components/SearchBar';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [editingStock, setEditingStock] = useState({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    if (backendStatus === 'connected') {
      loadProducts();
      loadCategories();
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

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSyncShopee = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const response = await api.syncShopeeProducts();
      await loadProducts();
      setSuccess(`Synced ${response.synced} products from Shopee`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to sync with Shopee: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleStockChange = (productId, value) => {
    setEditingStock(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleStockBlur = async (productId) => {
    const newStock = editingStock[productId];

    if (newStock === undefined) return;

    try {
      setError(null);
      await api.updateShopeeStock(productId, parseInt(newStock));
      await loadProducts();

      setEditingStock(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });

      setSuccess('Stock updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update stock: ' + err.message);
      setTimeout(() => setError(null), 5000);
      await loadProducts();
    }
  };

  const handleCreateProduct = async (productData) => {
    try {
      setError(null);
      await api.createProduct(productData);
      await loadProducts();
      await loadCategories();
      setShowProductForm(false);
      setSuccess('Product created successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create product: ' + err.message);
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      setError(null);
      await api.updateProduct(editingProduct._id, productData);
      await loadProducts();
      await loadCategories();
      setEditingProduct(null);
      setSuccess('Product updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (password) => {
    try {
      setError(null);
      await api.deleteProduct(deletingProduct._id, password);
      await loadProducts();
      setDeletingProduct(null);
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      throw new Error(err.message || 'Failed to delete product');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    const matchesStatus = statusFilter === 'all' || product.shopee?.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProductForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
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

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="NORMAL">Normal</option>
                <option value="UNLIST">Unlisted</option>
                <option value="DELETED">Deleted</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500 mt-1">Click on stock value to edit, or use action buttons to manage products</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' ? (
                <>
                  <p className="text-gray-600 mb-4">No products match your filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">No products found</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowProductForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                        )}
                        {product.brand && (
                          <div className="text-xs text-gray-400">Brand: {product.brand}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        RM {product.shopee?.price || product.price}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={editingStock[product._id] !== undefined ? editingStock[product._id] : (product.shopee?.stock || 0)}
                          onChange={(e) => handleStockChange(product._id, e.target.value)}
                          onBlur={() => handleStockBlur(product._id)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          min="0"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.shopee?.status === 'NORMAL'
                            ? 'bg-green-100 text-green-800'
                            : product.shopee?.status === 'UNLIST'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.shopee?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProductForm && (
        <ProductForm
          onClose={() => setShowProductForm(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdateProduct}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteProduct}
        />
      )}
    </div>
  );
}
