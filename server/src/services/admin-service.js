const { hashPasswordWithSalt } = require('../utils/hash-password');
const { createUser } = require('../repositories/user-repository');
const { validateRoleByName, validateStatus } = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');

/**
 * Business logic for creating an admin user.
 */
const createAdmin = async ({
                             email,
                             password,
                             role,
                             status,
                             firstname,
                             lastname,
                             phoneNumber = null,
                             jobTitle = null,
                             note = null,
                             createdBy = null,
                           }) => {
  try {
    // Validate role and status
    const roleId = await validateRoleByName(role);
    const statusId = await validateStatus(status);
    
    // Hash the password
    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(password);
    
    // Create the admin user in the database
    const newAdmin = await createUser({
      email,
      passwordHash,
      passwordSalt,
      roleId,
      statusId,
      firstname,
      lastname,
      phoneNumber,
      jobTitle,
      note,
      createdBy,
    });
    
    return newAdmin.id;
  } catch (error) {
    logError('Error in createAdmin service:', error);
    throw new Error('Failed to create admin.');
  }
};

module.exports = { createAdmin };
