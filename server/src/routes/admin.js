const express = require('express');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const adminSchema = require('../validators/admin-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const {
  getAdmins,
  updateAdmin,
  deleteAdmin,
  createAdminController,
} = require('../controllers/admin-controller');
const { ADMIN } = require('../utils/constants/domain/permissions');
const { csrfMiddleware } = require('../middlewares/csrf-protection');

const router = express.Router();

/**
 * @route   POST /admin/create
 * @desc    Create a new admin user
 * @access  Restricted to root_admin and admin roles
 */
router.post(
  '/create',
  csrfMiddleware,
  authorize([ADMIN.CREATE]), // Restrict access to specific roles
  validate(adminSchema), // Validate input with Joi
  sanitizeFields(['description'], true), // Rich text sanitization
  sanitizeFields(['title']), // Plain text sanitization
  createAdminController // Business logic
);

/**
 * @route   GET /admin
 * @desc    Fetch all admin users
 * @access  Restricted to root_admin role
 */
router.get(
  '/',
  // authorize(['root_admin']), // Only root_admin can fetch all admins
  getAdmins // Controller logic
);

/**
 * @route   PUT /admin/:id
 * @desc    Update an admin user
 * @access  Restricted to root_admin and admin roles
 */
router.put(
  '/:id',
  // authorize(['root_admin', 'admin']), // Restrict access to specific roles
  validate(adminSchema), // Validate input for updates
  updateAdmin // Controller logic
);

/**
 * @route   DELETE /admin/:id
 * @desc    Delete an admin user
 * @access  Restricted to root_admin role
 */
router.delete(
  '/:id',
  // authorize(['root_admin']), // Only root_admin can delete admins
  deleteAdmin // Controller logic
);

module.exports = router;
