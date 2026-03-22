// Dexter Wong Xing You A0255437Y
import request from 'supertest';
import app from '../../server.js';
import userModel from '../../models/userModel.js';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';

describe('Admin Product Creation -> Product Listing Integration Tests', () => {
  let adminToken;
  let booksCategory;

  const createAdminCredentials = () => ({
    name: 'Admin Product Creator',
    email: `admin.create.${Date.now()}.${Math.random()
      .toString(36)
      .slice(2)}@example.com`,
    password: 'Password123!',
    password_confirm: 'Password123!',
    phone: '91234567',
    address: '123 Testing Street',
    answer: 'blue',
  });

  const registerPromoteAndLoginAdmin = async () => {
    const adminCredentials = createAdminCredentials();

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(adminCredentials);

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);

    const createdUser = await userModel.findOne({ email: adminCredentials.email });
    expect(createdUser).not.toBeNull();

    createdUser.role = 1;
    await createdUser.save();

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: adminCredentials.email,
      password: adminCredentials.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toBeDefined();

    adminToken = loginResponse.body.token;
  };

  beforeEach(async () => {
    booksCategory = await new categoryModel({
      name: `Books-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug: `books-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }).save();

    await registerPromoteAndLoginAdmin();
  });

  describe('POST /api/v1/product/create-product', () => {
    test('should allow an admin to create a new product successfully', async () => {
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Integration Testing Book')
        .field('description', 'A textbook created through integration testing')
        .field('price', '79.99')
        .field('category', booksCategory._id.toString())
        .field('quantity', '50')
        .field('shipping', 'false');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product Created Successfully');
      expect(response.body.products).toBeDefined();

      expect(response.body.products).toEqual(
        expect.objectContaining({
          name: 'Integration Testing Book',
          slug: 'Integration-Testing-Book',
          description: 'A textbook created through integration testing',
          price: 79.99,
          quantity: 50,
        })
      );

      const savedProduct = await productModel.findOne({
        name: 'Integration Testing Book',
      });

      expect(savedProduct).not.toBeNull();
      expect(savedProduct.slug).toBe('Integration-Testing-Book');
      expect(savedProduct.description).toBe(
        'A textbook created through integration testing'
      );
      expect(savedProduct.price).toBe(79.99);
      expect(savedProduct.quantity).toBe(50);
      expect(savedProduct.category.toString()).toBe(booksCategory._id.toString());
    });

    test('should make the newly created product visible in the products listing', async () => {
      const createResponse = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Listing Visibility Product')
        .field('description', 'This product should appear in get-product results')
        .field('price', '120')
        .field('category', booksCategory._id.toString())
        .field('quantity', '12')
        .field('shipping', 'true');

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      const listResponse = await request(app).get('/api/v1/product/get-product');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.products)).toBe(true);

      const createdProduct = listResponse.body.products.find(
        (product) => product.name === 'Listing Visibility Product'
      );

      expect(createdProduct).toBeDefined();
      expect(createdProduct).toEqual(
        expect.objectContaining({
          name: 'Listing Visibility Product',
          slug: 'Listing-Visibility-Product',
          description: 'This product should appear in get-product results',
          price: 120,
          quantity: 12,
        })
      );
    });

    test('should make the newly created product retrievable by its slug', async () => {
      const createResponse = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Slug Lookup Product')
        .field('description', 'This product should be fetched by slug')
        .field('price', '59.5')
        .field('category', booksCategory._id.toString())
        .field('quantity', '8')
        .field('shipping', 'false');

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      const slugResponse = await request(app).get(
        '/api/v1/product/get-product/Slug-Lookup-Product'
      );

      expect(slugResponse.status).toBe(200);
      expect(slugResponse.body.success).toBe(true);
      expect(slugResponse.body.product).toEqual(
        expect.objectContaining({
          name: 'Slug Lookup Product',
          slug: 'Slug-Lookup-Product',
          description: 'This product should be fetched by slug',
          price: 59.5,
          quantity: 8,
        })
      );
    });

    test('should reject creation when a required field is missing', async () => {
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Invalid Product Missing Price')
        .field('description', 'This should fail validation')
        .field('category', booksCategory._id.toString())
        .field('quantity', '5')
        .field('shipping', 'false');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Price is Required');

      const savedProduct = await productModel.findOne({
        name: 'Invalid Product Missing Price',
      });
      expect(savedProduct).toBeNull();
    });

    test('should reject creation when category is missing', async () => {
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Invalid Product Missing Category')
        .field('description', 'This should fail because category is missing')
        .field('price', '45')
        .field('quantity', '3')
        .field('shipping', 'false');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Category is Required');

      const savedProduct = await productModel.findOne({
        name: 'Invalid Product Missing Category',
      });
      expect(savedProduct).toBeNull();
    });

    test('should reject creation from a non-admin authenticated user', async () => {
      const normalUserCredentials = {
        name: 'Normal User',
        email: `normal.user.${Date.now()}.${Math.random()
          .toString(36)
          .slice(2)}@example.com`,
        password: 'Password123!',
        password_confirm: 'Password123!',
        phone: '98765432',
        address: '456 User Street',
        answer: 'green',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(normalUserCredentials);

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: normalUserCredentials.email,
        password: normalUserCredentials.password,
      });

      expect(loginResponse.status).toBe(200);
      const normalUserToken = loginResponse.body.token;

      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', normalUserToken)
        .field('name', 'Unauthorized Product')
        .field('description', 'A normal user should not create this')
        .field('price', '99')
        .field('category', booksCategory._id.toString())
        .field('quantity', '2')
        .field('shipping', 'false');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized Access');

      const savedProduct = await productModel.findOne({
        name: 'Unauthorized Product',
      });
      expect(savedProduct).toBeNull();
    });

    test('should reject creation when no authentication token is provided', async () => {
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .field('name', 'No Token Product')
        .field('description', 'This request should be blocked')
        .field('price', '88')
        .field('category', booksCategory._id.toString())
        .field('quantity', '9')
        .field('shipping', 'false');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error in sign in verification');

      const savedProduct = await productModel.findOne({
        name: 'No Token Product',
      });
      expect(savedProduct).toBeNull();
    });

    test('should persist multiple valid creations and expose them in listing flow', async () => {
      const firstCreateResponse = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'First Admin Product')
        .field('description', 'First product created by admin')
        .field('price', '30')
        .field('category', booksCategory._id.toString())
        .field('quantity', '4')
        .field('shipping', 'false');

      const secondCreateResponse = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', 'Second Admin Product')
        .field('description', 'Second product created by admin')
        .field('price', '60')
        .field('category', booksCategory._id.toString())
        .field('quantity', '6')
        .field('shipping', 'true');

      expect(firstCreateResponse.status).toBe(201);
      expect(secondCreateResponse.status).toBe(201);

      const dbProducts = await productModel.find({
        name: { $in: ['First Admin Product', 'Second Admin Product'] },
      });

      expect(dbProducts).toHaveLength(2);

      const listingResponse = await request(app).get('/api/v1/product/get-product');

      expect(listingResponse.status).toBe(200);

      const listedNames = listingResponse.body.products.map((product) => product.name);
      expect(listedNames).toEqual(
        expect.arrayContaining(['First Admin Product', 'Second Admin Product'])
      );
    });
  });
});