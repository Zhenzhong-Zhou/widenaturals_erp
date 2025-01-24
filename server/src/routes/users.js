/**
 * @file users.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getAllUsersController,
  getUserProfile,
  getPermissions,
} = require('../controllers/user-controller');
const { createUserProfileRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

// Route for getting all users
router.get('/', getAllUsersController);

/**
 * @route GET /users/me
 * @description Fetch the authenticated user's profile.
 */
router.get('/me', createUserProfileRateLimiter(), getUserProfile);

router.get('/me/permissions', getPermissions);

module.exports = router;
