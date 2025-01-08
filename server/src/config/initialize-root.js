const { logError, logInfo, logWarn, logFatal } = require('../utils/logger-helper');
const { hashPasswordWithSalt } = require('../utils/password-helper');
const { createUser, getUserByEmail } = require('../repositories/user-repository');
const { validateRoleByName, validateStatus } = require('../validators/db-validators');
const AppError = require('../utils/app-error');

/**
 * Initializes the root admin account if it doesn't already exist.
 */
const initializeRootAdmin = async () => {
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  
  if (!email || !password) {
    logFatal('Root admin credentials are missing in environment variables.');
    process.exit(1); // Terminate if credentials are missing
  }
  
  try {
    // Check if root admin already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      logWarn('Root admin already exists. Skipping initialization.');
      return;
    }
    
    // Validate role and status
    const roleId = await validateRoleByName('root_admin');
    const statusId = await validateStatus('active');
    
    // Hash the password
    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(password);
    
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
      jobTitle: 'System Administrator',
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
    
    throw error; // Re-throw to allow server start process to handle it
  }
};

module.exports = { initializeRootAdmin };
