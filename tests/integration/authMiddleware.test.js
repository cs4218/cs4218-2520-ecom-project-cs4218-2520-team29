// Chia Jia Ye A0286580U
import request from 'supertest';
import { testUsers } from './testHelpers.js';
import app from '../../server.js';

describe('Authentication Middleware Integration Tests', () => {
  
  describe('Protected Route Access with Middleware', () => {

    // middleware should allow authenticated requests
    test('should allow access to protected routes with valid token', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      // Login and get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      const token = loginResponse.body.token;

      // Access protected route with valid token
      const protectedResponse = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', token);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.ok).toBe(true);
    });

    // middleware should reject unauthenticated requests
    test('should deny access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user-auth');

      expect(response.status).toBe(401);
    });

    // middleware should reject invalid tokens
    test('should deny access to protected routes with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', 'invalid-token-xyz');

      expect(response.status).toBe(401);
    });

    // middleware should validate token format
    test('should deny access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });
  });

  describe('Admin vs User Middleware', () => {

    // middleware should work with isAdmin checks
    test('should prevent non-admin users from accessing admin routes', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      // Try to access admin route as regular user
      const adminResponse = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', loginResponse.body.token);

      expect(adminResponse.status).toBe(401);
    });
  });

  describe('Token Expiration Integration', () => {

    test('should include token expiration info in JWT', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      const token = loginResponse.body.token;
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      // Token should have exp (expiration) claim
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});