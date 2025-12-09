import React, { useState } from 'react';
import { Package, RefreshCw, Plus, Edit2, Trash2, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';

export default function InventoryManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([
    {
      id: 1,
      sku: 'PROD-001',
      name: 'Wireless Earbuds',
      totalStock: 150,
      shopee: { stock: 50, price: 299, status: 'active' },
      lazada: { stock: 50, price: 299, status: 'active' },
      tiktok: { stock: 50, price: 299, status: 'active' }
    },
    {
      id: 2,
      sku: 'PROD-002',
      name: 'Smart Watch',
      totalStock: 75,
      shopee: { stock: 25, price: 1299, status: 'active' },
      lazada: { stock: 25, price: 1299, status: 'active' },
      tiktok: { stock: 25, price: 1299, status: 'active' }
    },
    {
      id: 3,
      sku: 'PROD-003',
      name: 'Phone Case',
      totalStock: 200,
      shopee: { stock: 70, price: 49, status: 'active' },
      lazada: { stock: 65, price: 49, status: 'active' },
      tiktok: { stock: 65, price: 49, status: 'active' }
    }
  ]);

  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    // Simulate API sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
    alert('Inventory synced successfully!');
  };

  const handleUpdateStock = (productId, platform, newStock) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const updated = { ...p };
        updated[platform].stock = parseInt(newStock);
        updated.totalStock = updated.shopee.stock + updated.lazada.stock + updated.tiktok.stock;
        return updated;
      }
      return p;
    }));
  };

  const getTotalStats = () => {
    const total = products.reduce((acc, p) => acc + p.totalStock, 0);
    const shopeeTotal = products.reduce((acc, p) => acc + p.shopee.stock, 0);
    const lazadaTotal = products.reduce((acc, p) => acc + p.lazada.stock, 0);
    const tiktokTotal = products.reduce((acc, p) => acc + p.tiktok.stock, 0);
    return { total, shopeeTotal, lazadaTotal, tiktokTotal };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Multi-Platform Inventory</h1>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            API Settings
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Shopee</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.shopeeTotal}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-orange-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lazada</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.lazadaTotal}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">TikTok Shop</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tiktokTotal}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-gray-900 opacity-20" />
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
              </div>
              <div className="space-y-3">
                {products.filter(p => p.totalStock < 100).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <p className="text-red-600 font-semibold">{product.totalStock} units</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Products</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shopee</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lazada</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">TikTok</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={product.shopee.stock}
                          onChange={(e) => handleUpdateStock(product.id, 'shopee', e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={product.lazada.stock}
                          onChange={(e) => handleUpdateStock(product.id, 'lazada', e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={product.tiktok.stock}
                          onChange={(e) => handleUpdateStock(product.id, 'tiktok', e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">{product.totalStock}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">API Connection Settings</h2>
            
            <div className="space-y-6">
              {/* Shopee */}
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Shopee API</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                    <input type="text" placeholder="Enter Shopee Partner ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner Key</label>
                    <input type="password" placeholder="Enter Shopee Partner Key" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Lazada */}
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Lazada API</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Key</label>
                    <input type="text" placeholder="Enter Lazada App Key" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                    <input type="password" placeholder="Enter Lazada App Secret" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* TikTok Shop */}
              <div className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">TikTok Shop API</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Key</label>
                    <input type="text" placeholder="Enter TikTok App Key" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                    <input type="password" placeholder="Enter TikTok App Secret" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Save API Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}