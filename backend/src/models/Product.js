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
  brand: {
    type: String,
    trim: true
  },
  // Weight in grams
  weight: {
    type: Number,
    min: 0
  },
  // Dimensions in cm
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
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
  // Product variations/models
  variations: [{
    name: String, // e.g., "Red-Large"
    sku: String,
    price: Number,
    stock: Number,
    modelId: Number // Shopee model_id
  }],
  hasVariations: {
    type: Boolean,
    default: false
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
    categoryId: {
      type: Number
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
      enum: ['NORMAL', 'BANNED', 'UNLIST', 'REVIEWING', 'SELLER_DELETE', 'SHOPEE_DELETE'],
      default: 'NORMAL'
    },
    condition: {
      type: String,
      enum: ['NEW', 'USED'],
      default: 'NEW'
    },
    // Logistic info
    weight: Number, // in grams
    packageLength: Number, // in cm
    packageWidth: Number,
    packageHeight: Number,
    daysToShip: {
      type: Number,
      default: 2
    },
    // Price settings
    priceInfo: [{
      modelId: Number,
      originalPrice: Number,
      currentPrice: Number
    }],
    // Stock info
    stockInfo: [{
      modelId: Number,
      normalStock: Number,
      reservedStock: Number
    }],
    // Attributes (brand, warranty, etc.)
    attributes: [{
      attributeId: Number,
      attributeName: String,
      attributeValue: String
    }],
    lastSyncedAt: Date
    // accessToken removed — tokens are now stored in ShopeeToken collection
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

// Virtual for stock calculation
productSchema.virtual('calculatedStock').get(function() {
  if (this.hasVariations && this.variations.length > 0) {
    return this.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return this.shopee?.stock || 0;
});

// Update totalStock before saving
productSchema.pre('save', function(next) {
  if (this.hasVariations && this.variations.length > 0) {
    this.totalStock = this.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else {
    this.totalStock = this.shopee?.stock || 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
