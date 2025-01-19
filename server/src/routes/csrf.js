const express = require('express');
const { generateCsrfTokenController } = require('../controllers/csrf-controller');

const router = express.Router();

// CSRF token generation route
router.get('/token', generateCsrfTokenController);

module.exports = router;
