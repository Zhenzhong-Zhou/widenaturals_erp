const express = require('express');
const request = require('supertest');
const configureHelmet = require('../../middlewares/helmet');

describe('Helmet Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
  });

  test('should include CSP headers in production', async () => {
    process.env.NODE_ENV = 'production';

    app.use(configureHelmet(true)); // Pass `true` for production

    app.get('/test', (req, res) => {
      res.status(200).send('Test route');
    });

    const response = await request(app).get('/test');

    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'"
    );
  });

  test('should not include CSP headers in development', async () => {
    process.env.NODE_ENV = 'development';

    app.use(configureHelmet(false)); // Pass `false` for development

    app.get('/test', (req, res) => {
      res.status(200).send('Test route');
    });

    const response = await request(app).get('/test');

    expect(response.headers['content-security-policy']).toBeUndefined();
  });
});
