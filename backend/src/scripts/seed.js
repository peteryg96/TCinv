require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const sampleProducts = [
  {
    sku: 'PROD-001',
    name: 'Wireless Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation',
    category: 'Electronics',
    price: 299,
    cost: 150,
    shopee: {
      stock: 50,
      price: 299,
      status: 'active'
    }
  },
  {
    sku: 'PROD-002',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch',
    category: 'Electronics',
    price: 1299,
    cost: 800,
    shopee: {
      stock: 25,
      price: 1299,
      status: 'active'
    }
  },
  {
    sku: 'PROD-003',
    name: 'Phone Case',
    description: 'Protective phone case',
    category: 'Accessories',
    price: 49,
    cost: 20,
    shopee: {
      stock: 100,
      price: 49,
      status: 'active'
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    console.log('🧹 Cleared existing products');

    // Insert sample data
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
