const AppError = require('../utils/AppError');
const { handleExit } = require('../utils/on-exit');
const {
  logSystemFatal,
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const { userExists } = require('../repositories/user-repository');
const {
  validateRoleByName,
  validateStatus,
} = require('../validators/db-validators');
const {
  ROOT_ADMIN_ROLE,
  ACTIVE_STATUS,
  JOB_TITLE,
} = require('../utils/constants/general/root-admin');
const { createUser } = require('../services/user-service');
const { maskSensitiveInfo } = require('../utils/sensitive-data-utils');

/**
 * Validates and hashes the password for the root admin.
 * This validation is specifically for one-time initialization.
 * @param {string} password - Plaintext password.
 * @returns {Object} - Hashed password and salt.
 */
const validateAndHashRootPassword = async (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=(.*[!@#$%^&*\-]){2,})(?=.{8,64})(?:(?!.*(.)\1\1).)*$/;

  if (!passwordRegex.test(password)) {
    throw AppError.validationError(
      'Root admin password must include at least one uppercase letter, one lowercase letter, one number, at least two special characters (!@#$%^&*-), be 8-64 characters long, and avoid repeating characters more than three times consecutively.'
    );
  }

  return password;
};

/**
 * Initializes the root admin account if it doesn't already exist.
 */
const initializeRootAdmin = async () => {
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;

  if (!email || !password) {
    logSystemFatal(
      'Root admin credentials are missing in environment variables.',
      {
        context: 'root-admin-init',
        severity: 'critical',
      }
    );
    await handleExit(1); // Terminate if credentials are missing
  }

  try {
    logSystemInfo('Initializing root admin account...', {
      context: 'root-admin-init',
    });

    // Check if the root admin already exists
    const existingUser = await userExists('email', email);
    if (existingUser) {
      logSystemWarn('Root admin already exists. Skipping initialization.', {
        context: 'root-admin-init',
        email: maskSensitiveInfo(email, 'email'),
      });
      return;
    }

    // Validate role and status
    const roleId = await validateRoleByName(ROOT_ADMIN_ROLE); // Ensure 'root_admin' role exists
    const statusId = await validateStatus(ACTIVE_STATUS); // Ensure 'active' status exists

    // Hash the root admin password
    const validatedPassword = await validateAndHashRootPassword(password);

    // Create the root admin user
    const user = await createUser({
      email,
      password: validatedPassword,
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

    const maskedEmail = maskSensitiveInfo(user.email, 'email');

    logSystemInfo(`Root admin initialized successfully: ${maskedEmail}`, {
      context: 'root-admin-init',
      email: maskedEmail,
    });
  } catch (error) {
    logSystemException(error, 'Error initializing root admin', {
      context: 'root-admin-init',
      severity: 'critical',
      email: maskSensitiveInfo(email, 'email'),
    });

    logSystemFatal('Root admin initialization failed', {
      context: 'root-admin-init',
      errorMessage: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      severity: 'critical',
    });

    // Terminate on critical error
    await handleExit(1);
  }
};

module.exports = { initializeRootAdmin };
