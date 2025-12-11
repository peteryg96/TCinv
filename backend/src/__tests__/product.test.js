const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  // Import app after DB connection
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Product API', () => {
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.sku).toBe(newProduct.sku);
      expect(response.body.name).toBe(newProduct.name);
    });

    it('should reject product without required fields', async () => {
      const invalidProduct = {
        name: 'Invalid Product'
      };

      await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product stock', async () => {
      // First create a product
      const product = await request(app)
        .post('/api/products')
        .send({
          sku: 'UPDATE-001',
          name: 'Update Test',
          description: 'Test',
          price: 50
        });

      const response = await request(app)
        .put(`/api/products/${product.body._id}`)
        .send({ stock: 100 })
        .expect(200);

      expect(response.body.stock).toBe(100);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });
});