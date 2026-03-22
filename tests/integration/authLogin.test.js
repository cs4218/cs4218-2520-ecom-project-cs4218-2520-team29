// Chia Jia Ye A0286580U
import request from 'supertest';
import { testUsers } from './testHelpers.js';
import app from '../../server.js';

describe('User Login Integration Tests', () => {
  const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  describe('Successful Login', () => {

    // successful login with valid credentials
    test('should successfully login with valid credentials', async () => {
      const user = {
        ...testUsers.validUser,
        email: uniqueEmail()
    };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(user);

        expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: user.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.name).toBe(user.name);
    });

    // session creation on successful login
    test('should create valid JWT token on successful login', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      expect(response.body.token).toBeDefined();
      const parts = response.body.token.split('.');
      expect(parts.length).toBe(3); // JWT has 3 parts
    });

    // password not be returned in API response
    test('should not return password in login response', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.name).toBeDefined();
    });

    // error message displayed for invalid credentials
    test('should return clear error message for invalid credentials', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });
  });

  describe('Invalid Credentials Handling', () => {

    // login with invalid email
    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUsers.validUser.password,
        });

      expect(response.status).toBe(404);
      expect(response.body.message.toLowerCase()).toContain('not registered');
    });

    // login with incorrect password
    test('should reject login with incorrect password', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: 'WrongPassword@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });
  });

  describe('Empty Field Validation', () => {

    // login with empty email
    test('should reject login with empty email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: testUsers.validUser.password,
        });

      expect(response.status).toBe(400);
    });

    // login with empty password
    test('should reject login with empty password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: '',
        });

      expect(response.status).toBe(400);
    });

    // login with both fields empty
    test('should reject login with both empty fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Email Format Validation', () => {

    // login with malformed email
    test('should reject login with malformed email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: testUsers.validUser.password,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Session and Token Management', () => {

    // access protected routes with valid token
    test('should allow access to protected routes with valid token', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      const token = loginResponse.body.token;

      // Use token for protected endpoint
      const protectedResponse = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', token);

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.body.ok).toBe(true);
    });

    test('should return ok true for authenticated user-auth request', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      const response = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', loginResponse.body.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    // session expiration after timeout
    test('should include expiration in JWT token', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      const token = response.body.token;
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      expect(payload.exp).toBeDefined();
    });

    // cannot access protected routes without session
    test('should deny access to protected routes with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user-auth')
        .set('Authorization', 'invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message.toLowerCase()).toContain('error in sign in verification');
    });

    // protected route without token at all
    test('should deny access to protected routes without any token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/user-auth');

      expect(response.status).toBe(401);
      expect(response.body.message.toLowerCase()).toContain('error in sign in verification');
    });
  });

  describe('Login Security', () => {

    // secure password transmission
    test('should not echo back password in response', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {

    // whitespace trimming
    test('should trim whitespace from email during login', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '  ' + testUsers.validUser.email + '  ',
          password: testUsers.validUser.password,
        });

      expect(response.status).toBe(200);
    });

    // special characters in password during login
    test('should accept passwords with special characters during login', async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(registerResponse.status).toBe(201);

      const specialPassword = 'P@ss!word#123$%&';
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          email: 'specialpass@example.com',
          password: specialPassword,
          password_confirm: specialPassword,
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'specialpass@example.com',
          password: specialPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('Complete Login Workflow', () => {

    // user can register and immediately log in
    test('should support complete register-and-login workflow', async () => {
      const newUser = {
        name: 'Workflow Test',
        email: 'workflow@example.com',
        password: 'WorkFlow@123',
        password_confirm: 'WorkFlow@123',
        phone: '1111111111',
        address: '789 Workflow St',
        question: 'First school?',
        answer: 'none',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(registerResponse.status).toBe(201);

      // Immediately login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
    });

    // redirect after successful login
    test('should provide user data for post-login redirect', async () => {
      const user = {
        ...testUsers.validUser,
        email: uniqueEmail()
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(user);

      expect(registerResponse.status).toBe(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: user.password,
        });

      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBeDefined();
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.role).toBeDefined();
    });
  });
});