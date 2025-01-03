/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const { login, signup } = require('../controllers/auth-controller');

const router = express.Router();

// Login route
router.post('/login', login);

// Signup route
router.post('/signup', signup);

module.exports = router;
