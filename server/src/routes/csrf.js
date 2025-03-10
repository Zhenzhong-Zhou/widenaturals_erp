const express = require('express');
const {
  generateCsrfTokenController,
} = require('../controllers/csrf-controller');
const { createCsrfTokenRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

// CSRF token generation route
router.get('/token', createCsrfTokenRateLimiter(), generateCsrfTokenController);

module.exports = router;
