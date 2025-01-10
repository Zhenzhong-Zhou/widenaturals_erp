const AppError = require('../utils/app-error');
const { handleExit } = require('../utils/on-exit');
const { logError, logInfo, logWarn, logFatal } = require('../utils/logger-helper');
const { hashPasswordWithSalt } = require('../utils/password-helper');
const { createUser, getUserByEmail } = require('../repositories/user-repository');
const { validateRoleByName, validateStatus } = require('../validators/db-validators');
const { ROOT_ADMIN_ROLE, ACTIVE_STATUS, JOB_TITLE } = require('../utils/constants/general/root-admin');

/**
 * Validates and hashes the password.
 * @param {string} password - Plaintext password.
 * @returns {Object} - Hashed password and salt.
 */
const validateAndHashPassword = async (password) => {
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
  return await hashPasswordWithSalt(password);
};

/**
 * Initializes the root admin account if it doesn't already exist.
 */
const initializeRootAdmin = async () => {
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  
  if (!email || !password) {
    logFatal('Root admin credentials are missing in environment variables.');
    await handleExit(1); // Terminate if credentials are missing
  }
  
  try {
    logInfo('Initializing root admin account...');
    
    // Check if root admin already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      logWarn('Root admin already exists. Skipping initialization.');
      return;
    }
    
    // Validate role and status
    const roleId = await validateRoleByName(ROOT_ADMIN_ROLE);
    const statusId = await validateStatus(ACTIVE_STATUS);
    
    // Validate and hash the password
    const { passwordHash, passwordSalt } = await validateAndHashPassword(password);
    
    // Create the root admin user
    const user = await createUser({
      email,
      passwordHash,
      passwordSalt,
      roleId,
      statusId,
      firstname: 'Root',
      lastname: 'Admin',
      phoneNumber: null,
      jobTitle: JOB_TITLE,
      note: 'Initial root admin account',
      statusDate: new Date(),
      createdBy: null,
    });
    
    logInfo(`Root admin initialized successfully: ${user.email}`);
  } catch (error) {
    logError('Error initializing root admin:', error);
    
    if (error instanceof AppError) {
      logFatal(`Root admin initialization failed due to: ${error.message}`);
    } else {
      logFatal('An unexpected error occurred during root admin initialization.');
    }
    
    // Terminate with cleanup on critical error
    await handleExit(1);
  }
};

module.exports = { initializeRootAdmin };
