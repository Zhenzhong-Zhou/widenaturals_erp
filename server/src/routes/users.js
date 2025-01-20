/**
 * @file users.js
 * @description Users-related routes.
 */

 const express = require('express');
const { getUserProfile } = require('../controllers/user-controller');

const router = express.Router();

// Profile route
router.get('/me', getUserProfile);

module.exports = router;
