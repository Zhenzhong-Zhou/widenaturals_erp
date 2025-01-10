jest.mock('../../utils/logger-helper', () => ({
  logWarn: jest.fn(), // Mock the logWarn function
}));

const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../../utils/rate-limit-helper');

describe('Rate Limiter Middleware', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add error-handling middleware
    app.use((err, req, res, next) => {
      if (err instanceof AppError) {
        return res.status(err.status).json(err.toJSON());
      }
      res.status(500).json({ message: 'Internal server error' });
    });
  });
  
  test('should block requests over the limit', async () => {
    const rateLimiter = createRateLimiter({ windowMs: 1000, max: 2 });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Make 3 requests (exceeding the limit of 2)
    await request(app).get('/test');
    await request(app).get('/test');
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(429); // Rate limit status
    console.log('Response body:', response.body); // Debug the response body
    expect(response.body.message).toBe(
      'You have exceeded the allowed number of requests. Please try again later.'
    );
  });
  
  test('should block requests over the limit', async () => {
    const rateLimiter = createRateLimiter({ windowMs: 1000, max: 2 });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Make 3 requests (exceeding the limit of 2)
    await request(app).get('/test');
    await request(app).get('/test');
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(429);
    expect(response.body.message).toBe(
      'You have exceeded the allowed number of requests. Please try again later.'
    );
  });
  
  test('should not rate limit in development mode when disableInDev is true', async () => {
    process.env.NODE_ENV = 'development';
    
    const rateLimiter = createRateLimiter({ disableInDev: true });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Make multiple requests to ensure no rate limiting in development mode
    for (let i = 0; i < 10; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Request allowed');
    }
  });
  
  test('should respect custom key generator', async () => {
    const customKeyGenerator = jest.fn((req) => req.headers['x-custom-key'] || 'default-key');
    
    const rateLimiter = createRateLimiter({
      windowMs: 1000,
      max: 1,
      keyGenerator: customKeyGenerator,
    });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Send requests with the same custom key
    await request(app).get('/test').set('x-custom-key', 'user1');
    const response = await request(app).get('/test').set('x-custom-key', 'user1');
    
    expect(response.status).toBe(429); // Blocked due to same key
    expect(customKeyGenerator).toHaveBeenCalledTimes(2);
  });
  
  test('should skip rate limiting when skip function returns true', async () => {
    const skipFunction = jest.fn(() => true);
    
    const rateLimiter = createRateLimiter({ skip: skipFunction });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Make multiple requests to ensure no rate limiting
    for (let i = 0; i < 10; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.text).toBe('Request allowed');
    }
    
    expect(skipFunction).toHaveBeenCalled();
  });
  
  test('should log and return a structured error when rate limit is exceeded', async () => {
    const rateLimiter = createRateLimiter({ windowMs: 1000, max: 1 });
    
    app.use(rateLimiter);
    
    app.get('/test', (req, res) => res.status(200).send('Request allowed'));
    
    // Exceed the rate limit
    await request(app).get('/test');
    const response = await request(app).get('/test');
    
    expect(response.status).toBe(429); // Rate limit status
    console.log('Response body:', response.body); // Debug the response body
    expect(response.body.message).toBe(
      'You have exceeded the allowed number of requests. Please try again later.'
    );
  });
});
