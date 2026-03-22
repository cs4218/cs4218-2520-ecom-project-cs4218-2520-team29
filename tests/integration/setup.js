// Chia Jia Ye A0286580U
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

dotenv.config({ path: '.env.test' });

// Suppress console logs during tests
const originalLog = console.log;
const originalError = console.error;

beforeAll(async () => {
  // Suppress server startup logs
  console.log = jest.fn();
  console.error = jest.fn();

  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URL_TEST, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      console.error = originalError;
      console.error('Failed to connect to MongoDB:', error);
    }
  }

  // Restore console after connection
  console.log = originalLog;
  console.error = originalError;
});

// Clean up after running all tests
afterAll(async () => {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
});

// Clear database between each test
afterEach(async () => {
  try {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  } catch (error) {
    // Silently ignore errors during cleanup
  }
});