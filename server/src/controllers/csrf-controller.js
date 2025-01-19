const { loadEnv } = require('../config/env');
const { logError } = require('../utils/logger-helper');
const { csrfError } = require('../utils/AppError');

loadEnv();

/**
 * Middleware to generate a CSRF token for frontend usage.
 * Supports sending tokens via headers or JSON response.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const generateCsrfTokenController = (req, res, next) => {
  try {
    const newCsrfToken = req.csrfToken(); // Generate CSRF token
    const tokenTransportMethod = process.env.CSRF_TOKEN_TRANSPORT || 'header';
    
    if (tokenTransportMethod === 'header') {
      res.set('X-CSRF-Token', newCsrfToken);
    }
    
    res.json({ newCsrfToken });
  } catch (error) {
    logError('CSRF Token Generation Error:', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
    next(
      csrfError('Failed to generate CSRF token.', {
        details: error.message,
      })
    );
  }
};

module.exports = { generateCsrfTokenController };
