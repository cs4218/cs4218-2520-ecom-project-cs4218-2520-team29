// Dexter Wong Xing You A0255437Y
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';

describe('Product Listing Integration Tests', () => {
  let booksCategory;
  let gadgetsCategory;
  let seededProducts = [];

  const createProductSeed = ({
    name,
    description,
    price,
    category,
    quantity = 10,
    shipping = false,
    createdAt,
  }) => ({
    _id: new mongoose.Types.ObjectId(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description,
    price,
    category,
    quantity,
    shipping,
    createdAt,
    updatedAt: createdAt,
  });

  beforeEach(async () => {
    booksCategory = await new categoryModel({
      name: 'Books',
      slug: 'books',
    }).save();

    gadgetsCategory = await new categoryModel({
      name: 'Gadgets',
      slug: 'gadgets',
    }).save();

    const now = Date.now();

    const productsToSeed = [
      createProductSeed({
        name: 'Alpha Book',
        description: 'Introductory textbook for testing',
        price: 25,
        category: booksCategory._id,
        createdAt: new Date(now - 1000),
      }),
      createProductSeed({
        name: 'Beta Book',
        description: 'Advanced testing textbook',
        price: 40,
        category: booksCategory._id,
        createdAt: new Date(now - 2000),
      }),
      createProductSeed({
        name: 'Gamma Gadget',
        description: 'Useful gadget for developers',
        price: 120,
        category: gadgetsCategory._id,
        createdAt: new Date(now - 3000),
      }),
      createProductSeed({
        name: 'Delta Gadget',
        description: 'Portable development gadget',
        price: 180,
        category: gadgetsCategory._id,
        createdAt: new Date(now - 4000),
      }),
      createProductSeed({
        name: 'Epsilon Book',
        description: 'Reference guide for integration tests',
        price: 60,
        category: booksCategory._id,
        createdAt: new Date(now - 5000),
      }),
      createProductSeed({
        name: 'Zeta Gadget',
        description: 'Compact gadget for debugging',
        price: 220,
        category: gadgetsCategory._id,
        createdAt: new Date(now - 6000),
      }),
      createProductSeed({
        name: 'Eta Book',
        description: 'Patterns for backend testing',
        price: 35,
        category: booksCategory._id,
        createdAt: new Date(now - 7000),
      }),
    ];

    seededProducts = await productModel.insertMany(productsToSeed);
  });

  describe('GET /api/v1/product/get-product', () => {
    test('should return all seeded products in expected response structure', async () => {
      const response = await request(app).get('/api/v1/product/get-product');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('ALlProducts ');
      expect(response.body.counTotal).toBe(seededProducts.length);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products).toHaveLength(seededProducts.length);

      const returnedNames = response.body.products.map((product) => product.name);
      expect(returnedNames).toEqual(
        expect.arrayContaining([
          'Alpha Book',
          'Beta Book',
          'Gamma Gadget',
          'Delta Gadget',
          'Epsilon Book',
          'Zeta Gadget',
          'Eta Book',
        ])
      );

      response.body.products.forEach((product) => {
        expect(product).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
            description: expect.any(String),
            price: expect.any(Number),
            quantity: expect.any(Number),
          })
        );

        expect(product.photo).toBeUndefined();

        expect(product.category).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
            slug: expect.any(String),
          })
        );
      });
    });

    test('should return products sorted by newest createdAt first', async () => {
      const response = await request(app).get('/api/v1/product/get-product');

      expect(response.status).toBe(200);
      expect(response.body.products[0].name).toBe('Alpha Book');
      expect(response.body.products[1].name).toBe('Beta Book');
      expect(response.body.products[2].name).toBe('Gamma Gadget');
    });

    test('should still return only up to 12 products from listing endpoint', async () => {
      const extraProducts = [];

      for (let i = 0; i < 8; i += 1) {
        extraProducts.push({
          name: `Extra Product ${i + 1}`,
          slug: `extra-product-${i + 1}`,
          description: `Extra seeded product ${i + 1}`,
          price: 10 + i,
          category: booksCategory._id,
          quantity: 5,
          shipping: false,
        });
      }

      await productModel.insertMany(extraProducts);

      const response = await request(app).get('/api/v1/product/get-product');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(12);
      expect(response.body.counTotal).toBe(12);
    });
  });

  describe('GET /api/v1/product/get-product/:slug', () => {
    test('should return the correct single product by slug', async () => {
      const targetProduct = seededProducts.find(
        (product) => product.name === 'Gamma Gadget'
      );

      const response = await request(app).get(
        `/api/v1/product/get-product/${targetProduct.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Single Product Fetched');

      expect(response.body.product).toEqual(
        expect.objectContaining({
          _id: targetProduct._id.toString(),
          name: 'Gamma Gadget',
          slug: 'gamma-gadget',
          description: 'Useful gadget for developers',
          price: 120,
          quantity: 10,
        })
      );

      expect(response.body.product.photo).toBeUndefined();
      expect(response.body.product.category).toEqual(
        expect.objectContaining({
          _id: gadgetsCategory._id.toString(),
          name: 'Gadgets',
          slug: 'gadgets',
        })
      );
    });

    test('should return null product for a non-existent slug without crashing', async () => {
      const response = await request(app).get(
        '/api/v1/product/get-product/non-existent-slug'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product).toBeNull();
    });
  });

  describe('POST /api/v1/product/product-filters', () => {
    test('should return only products matching the selected category', async () => {
      const response = await request(app)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [booksCategory._id.toString()],
          radio: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);

      response.body.products.forEach((product) => {
        expect(product.category.toString()).toBe(booksCategory._id.toString());
      });

      const returnedNames = response.body.products.map((product) => product.name);
      expect(returnedNames).toEqual(
        expect.arrayContaining([
          'Alpha Book',
          'Beta Book',
          'Epsilon Book',
          'Eta Book',
        ])
      );
      expect(returnedNames).not.toEqual(expect.arrayContaining(['Gamma Gadget']));
    });

    test('should return only products within the selected price range', async () => {
      const response = await request(app)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [],
          radio: [30, 130],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);

      response.body.products.forEach((product) => {
        expect(product.price).toBeGreaterThanOrEqual(30);
        expect(product.price).toBeLessThanOrEqual(130);
      });

      const returnedNames = response.body.products.map((product) => product.name);
      expect(returnedNames).toEqual(
        expect.arrayContaining([
          'Beta Book',
          'Epsilon Book',
          'Eta Book',
          'Gamma Gadget',
        ])
      );
      expect(returnedNames).not.toEqual(
        expect.arrayContaining(['Alpha Book', 'Delta Gadget', 'Zeta Gadget'])
      );
    });

    test('should return only products matching both category and price filters', async () => {
      const response = await request(app)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [gadgetsCategory._id.toString()],
          radio: [100, 200],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const returnedNames = response.body.products.map((product) => product.name);
      expect(returnedNames).toEqual(
        expect.arrayContaining(['Gamma Gadget', 'Delta Gadget'])
      );
      expect(returnedNames).not.toEqual(
        expect.arrayContaining(['Zeta Gadget', 'Alpha Book', 'Beta Book'])
      );

      response.body.products.forEach((product) => {
        expect(product.category.toString()).toBe(gadgetsCategory._id.toString());
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(200);
      });
    });

    test('should return an empty list when no products match the filters', async () => {
      const response = await request(app)
        .post('/api/v1/product/product-filters')
        .send({
          checked: [booksCategory._id.toString()],
          radio: [500, 800],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toEqual([]);
    });
  });

  describe('GET /api/v1/product/product-count', () => {
    test('should return the correct total number of products', async () => {
      const response = await request(app).get('/api/v1/product/product-count');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.total).toBe(seededProducts.length);

      const dbCount = await productModel.countDocuments();
      expect(response.body.total).toBe(dbCount);
    });
  });

  describe('GET /api/v1/product/product-list/:page', () => {
    test('should return the first page with at most 6 products', async () => {
      const response = await request(app).get('/api/v1/product/product-list/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products).toHaveLength(6);

      expect(response.body.products[0].name).toBe('Alpha Book');
      expect(response.body.products[1].name).toBe('Beta Book');
      expect(response.body.products[5].name).toBe('Zeta Gadget');

      response.body.products.forEach((product) => {
        expect(product.photo).toBeUndefined();
      });
    });

    test('should return the remaining products on the second page', async () => {
      const response = await request(app).get('/api/v1/product/product-list/2');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe('Eta Book');
    });

    test('should return an empty list for a page beyond the available data', async () => {
      const response = await request(app).get('/api/v1/product/product-list/3');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toEqual([]);
    });
  });
});