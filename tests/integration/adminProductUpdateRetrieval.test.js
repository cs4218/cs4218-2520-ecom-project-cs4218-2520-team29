// Dexter Wong Xing You A0255437Y
import request from 'supertest';
import app from '../../server.js';
import userModel from '../../models/userModel.js';
import productModel from '../../models/productModel.js';
import categoryModel from '../../models/categoryModel.js';

describe('Admin Product Update -> Product Retrieval / Listing Integration Tests', () => {
  let adminToken;
  let originalCategory;
  let updatedCategory;
  let seededProduct;

  const createAdminCredentials = () => ({
    name: 'Admin Product Updater',
    email: `admin.update.${Date.now()}.${Math.random()
      .toString(36)
      .slice(2)}@example.com`,
    password: 'Password123!',
    password_confirm: 'Password123!',
    phone: '91234567',
    address: '123 Update Street',
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
    originalCategory = await new categoryModel({
      name: `Books-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug: `books-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }).save();

    updatedCategory = await new categoryModel({
      name: `Electronics-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug: `electronics-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }).save();

    seededProduct = await new productModel({
      name: 'Original Product',
      slug: 'Original-Product',
      description: 'Initial seeded product description',
      price: 49.99,
      category: originalCategory._id,
      quantity: 20,
      shipping: false,
    }).save();

    await registerPromoteAndLoginAdmin();
  });

  describe('PUT /api/v1/product/update-product/:pid', () => {
    test('should allow an admin to update an existing product successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Updated Product')
        .field('description', 'Updated product description from integration test')
        .field('price', '89.5')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '35')
        .field('shipping', 'true');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product Updated Successfully');
      expect(response.body.products).toBeDefined();

      expect(response.body.products).toEqual(
        expect.objectContaining({
          name: 'Updated Product',
          slug: 'Updated-Product',
          description: 'Updated product description from integration test',
          price: 89.5,
          quantity: 35,
          shipping: true,
        })
      );

      const updatedProductInDb = await productModel.findById(seededProduct._id);

      expect(updatedProductInDb).not.toBeNull();
      expect(updatedProductInDb.name).toBe('Updated Product');
      expect(updatedProductInDb.slug).toBe('Updated-Product');
      expect(updatedProductInDb.description).toBe(
        'Updated product description from integration test'
      );
      expect(updatedProductInDb.price).toBe(89.5);
      expect(updatedProductInDb.quantity).toBe(35);
      expect(updatedProductInDb.shipping).toBe(true);
      expect(updatedProductInDb.category.toString()).toBe(
        updatedCategory._id.toString()
      );
    });

    test('should preserve the same product id after update', async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Same Id Product')
        .field('description', 'The product id should remain unchanged after update')
        .field('price', '75')
        .field('category', originalCategory._id.toString())
        .field('quantity', '18')
        .field('shipping', 'false');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const updatedProductInDb = await productModel.findById(seededProduct._id);

      expect(updatedProductInDb._id.toString()).toBe(seededProduct._id.toString());
      expect(response.body.products._id.toString()).toBe(seededProduct._id.toString());
    });

    test('should make the updated product retrievable through single product fetch', async () => {
      const updateResponse = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Retrieved Updated Product')
        .field('description', 'This updated product should be visible in single fetch')
        .field('price', '109.99')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '42')
        .field('shipping', 'true');

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.success).toBe(true);

      const updatedSlug = updateResponse.body.products.slug;

      const retrievalResponse = await request(app).get(
        `/api/v1/product/get-product/${updatedSlug}`
      );

      expect(retrievalResponse.status).toBe(200);
      expect(retrievalResponse.body.success).toBe(true);
      expect(retrievalResponse.body.product).toEqual(
        expect.objectContaining({
          _id: seededProduct._id.toString(),
          name: 'Retrieved Updated Product',
          slug: updatedSlug,
          description: 'This updated product should be visible in single fetch',
          price: 109.99,
          quantity: 42,
          shipping: true,
        })
      );

      expect(retrievalResponse.body.product.category).toEqual(
        expect.objectContaining({
          _id: updatedCategory._id.toString(),
          name: updatedCategory.name,
          slug: updatedCategory.slug,
        })
      );
    });

    test('should make the updated product visible in the products listing', async () => {
      const updateResponse = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Listing Updated Product')
        .field('description', 'This updated product should appear in listing results')
        .field('price', '64.25')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '28')
        .field('shipping', 'false');

      expect(updateResponse.status).toBe(201);
      expect(updateResponse.body.success).toBe(true);

      const listingResponse = await request(app).get('/api/v1/product/get-product');

      expect(listingResponse.status).toBe(200);
      expect(listingResponse.body.success).toBe(true);
      expect(Array.isArray(listingResponse.body.products)).toBe(true);

      const updatedProduct = listingResponse.body.products.find(
        (product) => product._id.toString() === seededProduct._id.toString()
      );

      expect(updatedProduct).toBeDefined();
      expect(updatedProduct).toEqual(
        expect.objectContaining({
          _id: seededProduct._id.toString(),
          name: 'Listing Updated Product',
          slug: 'Listing-Updated-Product',
          description: 'This updated product should appear in listing results',
          price: 64.25,
          quantity: 28,
          shipping: false,
        })
      );

      expect(updatedProduct.category).toEqual(
        expect.objectContaining({
          _id: updatedCategory._id.toString(),
          name: updatedCategory.name,
          slug: updatedCategory.slug,
        })
      );
    });

    test('should reject update when a required field is missing', async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Missing Price Update')
        .field('description', 'This update should fail because price is missing')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '10')
        .field('shipping', 'false');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Price is Required');

      const unchangedProduct = await productModel.findById(seededProduct._id);

      expect(unchangedProduct.name).toBe('Original Product');
      expect(unchangedProduct.slug).toBe('Original-Product');
      expect(unchangedProduct.description).toBe(
        'Initial seeded product description'
      );
      expect(unchangedProduct.price).toBe(49.99);
      expect(unchangedProduct.quantity).toBe(20);
      expect(unchangedProduct.shipping).toBe(false);
      expect(unchangedProduct.category.toString()).toBe(
        originalCategory._id.toString()
      );
    });

    test('should reject update when category is missing', async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Missing Category Update')
        .field('description', 'This update should fail because category is missing')
        .field('price', '70')
        .field('quantity', '11')
        .field('shipping', 'true');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Category is Required');

      const unchangedProduct = await productModel.findById(seededProduct._id);

      expect(unchangedProduct.name).toBe('Original Product');
      expect(unchangedProduct.category.toString()).toBe(
        originalCategory._id.toString()
      );
    });

    test('should reject update from a non-admin authenticated user', async () => {
      const normalUserCredentials = {
        name: 'Normal Update User',
        email: `normal.update.${Date.now()}.${Math.random()
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
      expect(loginResponse.body.success).toBe(true);

      const normalUserToken = loginResponse.body.token;

      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', normalUserToken)
        .field('name', 'Unauthorized Update')
        .field('description', 'A normal user should not update this product')
        .field('price', '90')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '4')
        .field('shipping', 'false');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized Access');

      const unchangedProduct = await productModel.findById(seededProduct._id);
      expect(unchangedProduct.name).toBe('Original Product');
    });

    test('should reject update when no authentication token is provided', async () => {
      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .field('name', 'No Token Update')
        .field('description', 'This request should be blocked')
        .field('price', '88')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '9')
        .field('shipping', 'false');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error in sign in verification');

      const unchangedProduct = await productModel.findById(seededProduct._id);
      expect(unchangedProduct.name).toBe('Original Product');
    });

    test('should update only the targeted product and leave other products unchanged', async () => {
      const untouchedProduct = await new productModel({
        name: 'Untouched Product',
        slug: 'Untouched-Product',
        description: 'This product should remain unchanged',
        price: 150,
        category: originalCategory._id,
        quantity: 7,
        shipping: true,
      }).save();

      const response = await request(app)
        .put(`/api/v1/product/update-product/${seededProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Targeted Product Update')
        .field('description', 'Only the targeted product should be updated')
        .field('price', '95')
        .field('category', updatedCategory._id.toString())
        .field('quantity', '31')
        .field('shipping', 'true');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const updatedTargetProduct = await productModel.findById(seededProduct._id);
      const unchangedOtherProduct = await productModel.findById(untouchedProduct._id);

      expect(updatedTargetProduct.name).toBe('Targeted Product Update');
      expect(updatedTargetProduct.slug).toBe('Targeted-Product-Update');
      expect(updatedTargetProduct.description).toBe(
        'Only the targeted product should be updated'
      );
      expect(updatedTargetProduct.price).toBe(95);
      expect(updatedTargetProduct.quantity).toBe(31);
      expect(updatedTargetProduct.category.toString()).toBe(
        updatedCategory._id.toString()
      );

      expect(unchangedOtherProduct.name).toBe('Untouched Product');
      expect(unchangedOtherProduct.slug).toBe('Untouched-Product');
      expect(unchangedOtherProduct.description).toBe(
        'This product should remain unchanged'
      );
      expect(unchangedOtherProduct.price).toBe(150);
      expect(unchangedOtherProduct.quantity).toBe(7);
      expect(unchangedOtherProduct.shipping).toBe(true);
      expect(unchangedOtherProduct.category.toString()).toBe(
        originalCategory._id.toString()
      );
    });
  });
});