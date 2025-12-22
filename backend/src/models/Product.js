const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'Products'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  shopee: {
    productId: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active'
    }
  },
  lazada: {
    productId: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active'
    }
  },
  tiktok: {
    productId: String,
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active'
    }
  },
  images: [{
    type: String
  }],
  erpnextSynced: {
    type: Boolean,
    default: false
  },
  erpnextItemCode: String,
  lastSyncedAt: Date
}, {
  timestamps: true
});

// Update totalStock before saving
productSchema.pre('save', function(next) {
  this.totalStock = 
    (this.shopee?.stock || 0) + 
    (this.lazada?.stock || 0) + 
    (this.tiktok?.stock || 0);
  next();
});

module.exports = mongoose.model('Product', productSchema);