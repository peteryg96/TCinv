const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    sku: 'PROD-001',
    name: 'Wireless Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation',
    category: 'Electronics',
    price: 299,
    cost: 150,
    shopee: { stock: 50, price: 299, status: 'active' },
    lazada: { stock: 50, price: 299, status: 'active' },
    tiktok: { stock: 50, price: 299, status: 'active' }
  },
  {
    sku: 'PROD-002',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor',
    category: 'Electronics',
    price: 1299,
    cost: 800,
    shopee: { stock: 25, price: 1299, status: 'active' },
    lazada: { stock: 25, price: 1299, status: 'active' },
    tiktok: { stock: 25, price: 1299, status: 'active' }
  },
  {
    sku: 'PROD-003',
    name: 'Phone Case',
    description: 'Durable protective phone case',
    category: 'Accessories',
    price: 49,
    cost: 20,
    shopee: { stock: 70, price: 49, status: 'active' },
    lazada: { stock: 65, price: 49, status: 'active' },
    tiktok: { stock: 65, price: 49, status: 'active' }
  },
  {
    sku: 'PROD-004',
    name: 'USB-C Cable',
    description: 'Fast charging USB-C cable 2m',
    category: 'Accessories',
    price: 89,
    cost: 35,
    shopee: { stock: 100, price: 89, status: 'active' },
    lazada: { stock: 100, price: 89, status: 'active' },
    tiktok: { stock: 100, price: 89, status: 'active' }
  },
  {
    sku: 'PROD-005',
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker',
    category: 'Electronics',
    price: 599,
    cost: 300,
    shopee: { stock: 30, price: 599, status: 'active' },
    lazada: { stock: 30, price: 599, status: 'active' },
    tiktok: { stock: 30, price: 599, status: 'active' }
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/inventory?authSource=admin'
    );
    
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🧹 Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log('✅ Seeded database with sample products');

    mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();