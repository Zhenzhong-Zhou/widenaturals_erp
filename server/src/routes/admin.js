const express = require('express');
const validate = require('../middlewares/validate');
const { createAdmin } = require('../controllers/admin-controller');
// const adminSchema = require('../validators/admin');
// const authorize = require('../middleware/authorize'); // Middleware to check permissions

const router = express.Router();

/**
 * @route   POST /admin/create
 * @desc    Create a new admin user
 * @access  Admin Only
 */
router.post(
  '/create',
  // authorize(['root_admin', 'admin']), // Ensure only specific roles can access
  // validate(adminSchema), // Validate input
  createAdmin // Controller logic
);

module.exports = router;
