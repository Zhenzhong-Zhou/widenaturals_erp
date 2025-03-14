const { logError } = require('../utils/logger-helper');
const { csrfError } = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');

/**
 * Middleware to generate a CSRF token for frontend usage.
 * Sends tokens via JSON response.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const generateCsrfTokenController = wrapAsync((req, res, next) => {
  try {
    const newCsrfToken = req.csrfToken(); // Generate CSRF token

    // Set cache-control headers to prevent token caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    // Return CSRF token in the response body
    res.json({ csrfToken: newCsrfToken });
  } catch (error) {
    logError('CSRF Token Generation Error:', {
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });

    next(
      csrfError('Failed to generate CSRF token.', {
        details: error.message,
      })
    );
  }
});

module.exports = { generateCsrfTokenController };
