jest.mock('../../utils/logger-helper', () => ({
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

const { logWarn } = require('../../utils/logger-helper');
const express = require('express');
const request = require('supertest');
const corsMiddleware = require('../../middlewares/cors');
const generalErrorHandler = require('../../middlewares/error-handlers/global-error-handler');

describe('CORS Middleware', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks
    app = express();
    app.use(corsMiddleware);
    app.use((req, res) => res.status(200).send('CORS Test Passed'));
    app.use(generalErrorHandler); // Use custom error handler
  });
  
  test('should allow requests from allowed origins', async () => {
    process.env.ALLOWED_ORIGINS = 'http://example.com,http://allowed.com';
    
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://example.com');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('CORS Test Passed');
    expect(response.header['access-control-allow-origin']).toBe('http://example.com');
  });
  
  test('should reject requests from disallowed origins', async () => {
    process.env.ALLOWED_ORIGINS = 'http://example.com';
    
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://disallowed.com');
    
    expect(response.status).toBe(500);
    const responseBody = JSON.parse(response.text);
    expect(responseBody.message).toBe("CORS error: Origin 'http://disallowed.com' is not allowed");
    expect(responseBody.status).toBe(500);
  });
  
  test('should allow requests when origin is undefined (non-browser clients)', async () => {
    process.env.ALLOWED_ORIGINS = 'http://example.com';
    
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('CORS Test Passed');
    expect(response.header['access-control-allow-origin']).toBeUndefined();
  });
  
  test('should log a warning when no allowed origins are specified', async () => {
    process.env.ALLOWED_ORIGINS = ''; // Simulate no allowed origins
    
    const response = await request(app).get('/'); // No Origin header sent
    expect(response.status).toBe(200); // Should still allow the request
    expect(logWarn).toHaveBeenCalledWith(
      'No allowed origins specified in ALLOWED_ORIGINS. CORS may be overly permissive.'
    );
  });
  
  test('should handle missing ALLOWED_ORIGINS in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGINS; // Simulate missing environment variable
    
    const response = await request(app).get('/');
    
    expect(response.status).toBe(500);
    const responseBody = JSON.parse(response.text);
    expect(responseBody.message).toContain('CORS configuration failed');
  });
  
  test('should allow preflight requests with correct status', async () => {
    process.env.ALLOWED_ORIGINS = 'http://example.com';
    
    const response = await request(app)
      .options('/')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'GET');
    
    expect(response.status).toBe(204);
    expect(response.header['access-control-allow-origin']).toBe('http://example.com');
    expect(response.header['access-control-allow-methods']).toBeDefined();
  });
  
  test('should handle preflight requests when no allowed origins are specified', async () => {
    process.env.ALLOWED_ORIGINS = '';
    
    const response = await request(app)
      .options('/')
      .set('Access-Control-Request-Method', 'GET');
    
    expect(response.status).toBe(204);
    expect(response.header['access-control-allow-origin']).toBeUndefined();
    expect(logWarn).toHaveBeenCalledWith(
      'No allowed origins specified in ALLOWED_ORIGINS. CORS may be overly permissive.'
    );
  });
});
