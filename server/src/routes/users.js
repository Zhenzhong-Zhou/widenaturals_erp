/**
 * @file users.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { getUserProfile } = require('../controllers/user-controller');

const router = express.Router();

/**
 * @route GET /users/me
 * @description Fetch the authenticated user's profile.
 */
router.get('/me', getUserProfile);

module.exports = router;
