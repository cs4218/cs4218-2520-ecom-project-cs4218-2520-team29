// Chia Jia Ye A0286580U
import request from 'supertest';
import User from '../../models/userModel.js';
import { testUsers } from './testHelpers.js';
import app from '../../server.js';

describe('User Registration Integration Tests', () => {
  
  describe('Successful Registration', () => {
    
    // successful registration with valid data
    test('should successfully register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(testUsers.validUser.email);
      expect(response.body.user.name).toBe(testUsers.validUser.name);
    });

    // user data stored in database correctly
    test('should persist user data to database correctly', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const user = await User.findOne({ email: testUsers.validUser.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(testUsers.validUser.name);
      expect(user.email).toBe(testUsers.validUser.email);
      expect(user.phone).toBe(testUsers.validUser.phone);
      expect(user.address).toBe(testUsers.validUser.address);
    });

    // password should be hashed
    test('should hash password and not store plaintext', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const user = await User.findOne({ email: testUsers.validUser.email });
      expect(user).toBeDefined();
      expect(user.password).not.toBe(testUsers.validUser.password);
      expect(user.password.length).toBeGreaterThan(20);
    });

    // user can log in after registration
    test('should enable user to login immediately after registration', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.validUser.email,
          password: testUsers.validUser.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user._id).toBeDefined();
      expect(loginResponse.body.token).toBeDefined();
    });

    // default user role assigned
    test('should assign default user role to new registrants', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const user = await User.findOne({ email: testUsers.validUser.email });
      expect(user.role).toBeDefined();
      expect(user.role).toBe(0);
    });

    // user profile populated correctly
    test('should populate user profile with all entered data', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const user = await User.findOne({ email: testUsers.validUser.email });
      expect(user.name).toBe(testUsers.validUser.name);
      expect(user.email).toBe(testUsers.validUser.email);
      expect(user.phone).toBe(testUsers.validUser.phone);
      expect(user.address).toBe(testUsers.validUser.address);
    });
  });

  describe('Email Validation', () => {

    // email already exists
    test('should reject registration with duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          name: 'Different Name',
        });

      expect(response.status).toBe(409);
      expect(response.body.message.toLowerCase()).toContain('already register please login');
    });

    // invalid email format
    test('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          email: 'not-a-valid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain('email');
    });

    // empty email field
    test('should reject registration with empty email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          email: '',
        });

      expect(response.status).toBe(400);
    });

    // email trimmed of whitespace
    test('should trim whitespace from email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          email: '  ' + testUsers.validUser.email + '  ',
        });

      expect(response.status).toBe(201);

      const user = await User.findOne({ email: testUsers.validUser.email });
      expect(user).toBeDefined();
      expect(user.email).toBe(testUsers.validUser.email);
    });

    // register immediately after account deletion
    test('should allow re-registration of same email after deletion', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      await User.deleteOne({ email: testUsers.validUser.email });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(response.status).toBe(201);
    });
  });

  describe('Password Validation', () => {

    // weak password rejected
    test('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message.toLowerCase()).toContain('password');
    });

    // password confirmation mismatch
    test('should reject registration when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: 'Password@123',
          password_confirm: 'DifferentPass@123',
        });

      expect(response.status).toBe(400);
    });

    // empty password field
    test('should reject registration with empty password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: '',
        });

      expect(response.status).toBe(400);
    });

    // very long password
    test('should enforce password length limits', async () => {
      const veryLongPassword = 'a'.repeat(500);
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: veryLongPassword,
        });

      expect(response.status).toBe(400);
    });

    // special characters in password
    test('should accept special characters in password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: 'P@ssw0rd!#$%&*',
          password_confirm: 'P@ssw0rd!#$%&*',
        });

      expect(response.status).toBe(201);
    });

    // password with spaces
    test('should not accept spaces in password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password: 'Pass word with spaces 123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Required Field Validation', () => {

    // empty password confirmation field
    test('should reject registration with empty password confirmation', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          password_confirm: '',
        });

      expect(response.status).toBe(400);
    });

    // empty username field
    test('should reject registration with empty name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          name: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Data Persistence and Storage', () => {

    // new user registration is independent from existing users
    test('should not affect existing users when registering new user', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      const firstUser = await User.findOne({ email: testUsers.validUser.email });
      const firstUserId = firstUser._id;

      const secondUserData = {
        name: 'Second User',
        email: 'second@example.com',
        password: 'Password@123',
        phone: '9876543210',
        address: '456 New St',
        dob: '2003-01-01',
        answer: 'softball',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(secondUserData);

      const firstUserAfter = await User.findOne({ _id: firstUserId });
      expect(firstUserAfter.email).toBe(testUsers.validUser.email);
      expect(firstUserAfter.name).toBe(testUsers.validUser.name);
    });
  });

  describe('Complete Registration Workflow', () => {

    // user can register and immediately log in
    test('should allow complete registration and login flow', async () => {
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

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user._id).toBe(registerResponse.body.user._id);
    });

    // same email cannot be registered twice
    test('should prevent registration of same email address twice', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/register')
        .send(testUsers.validUser);

      expect(response1.status).toBe(201);

      const response2 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUsers.validUser,
          name: 'Different Name',
        });

      expect(response2.status).toBe(409);
      expect(response2.body.message.toLowerCase()).toContain('already register please login');
    });
  });
});