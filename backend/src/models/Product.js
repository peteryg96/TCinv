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
  // Shopee specific fields
  shopee: {
    productId: {
      type: String,
      sparse: true
    },
    itemId: {
      type: Number,
      sparse: true
    },
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
      enum: ['active', 'inactive', 'deleted', 'banned'],
      default: 'active'
    },
    lastSyncedAt: Date
  },
  totalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Virtual for stock calculation (currently just Shopee)
productSchema.virtual('calculatedStock').get(function() {
  return this.shopee?.stock || 0;
});

// Update totalStock before saving
productSchema.pre('save', function(next) {
  this.totalStock = this.shopee?.stock || 0;
  next();
});

module.exports = mongoose.model('Product', productSchema);
