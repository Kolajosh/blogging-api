const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging-api-test');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        password: 'password123'
      };

      await request(app).post('/api/auth/signup').send(userData);
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email already exists');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/signup').send({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@test.com',
        password: 'password123'
      });
    });

    it('should login user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'jane.smith@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'jane.smith@test.com');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'jane.smith@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});