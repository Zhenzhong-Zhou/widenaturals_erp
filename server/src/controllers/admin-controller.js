const wrapAsync = require('../utils/wrap-async');
const {
  getAdminsFromDB,
  updateAdminInDB,
  deleteAdminFromDB,
} = require('../repositories/user-repository');
const { createAdmin } = require('../services/admin-service');
const { logError } = require('../utils/logger-helper');

/**
 * Handles admin creation.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const createAdminController = wrapAsync(async (req, res) => {
  const adminData = req.body;

  try {
    // Call the service layer to handle business logic
    const newAdmin = await createAdmin(adminData);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: newAdmin,
    });
  } catch (error) {
    if (error.isExpected) {
      return res.status(400).json({ error: error.message });
    }

    // Log the error for debugging purposes
    logError('Error creating admin:', error);

    // Pass unexpected errors to the global error handler
    throw error;
  }
});

/**
 * Fetches all admin users from the database.
 */
const getAdmins = async (req, res) => {
  try {
    const admins = await getAdminsFromDB();
    res.status(200).json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Updates an admin user in the database.
 */
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role } = req.body;

    const updatedAdmin = await updateAdminInDB(id, {
      email,
      firstName,
      lastName,
      role,
    });
    res
      .status(200)
      .json({ message: 'Admin updated successfully', admin: updatedAdmin });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Deletes an admin user from the database.
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAdminFromDB(id);
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createAdminController,
  getAdmins,
  updateAdmin,
  deleteAdmin,
};
