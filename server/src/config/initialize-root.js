const { handleExit } = require('../utils/on-exit');
const {
  logSystemFatal,
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const {
  userExistsByField,
} = require('../repositories/user-repository');
const { resolveRoleIdByName } = require('../repositories/role-repository');
const {
  validateStatus,
} = require('../validators/db-validators');
const {
  ROOT_ADMIN_ROLE,
  ACTIVE_STATUS,
  JOB_TITLE,
} = require('../utils/constants/general/root-admin');
const { createUserService } = require('../services/user-service');
const { maskSensitiveInfo } = require('../utils/sensitive-data-utils');
const { validatePasswordStrength } = require('../security/password-policy');

/**
 * Initializes the root admin account if it does not already exist.
 *
 * Bootstrap-only operation:
 * - Runs before permissions or users exist
 * - Bypasses standard ACL checks via explicit bootstrap actor
 * - Terminates the process on failure
 */
const initializeRootAdmin = async () => {
  const context = 'root-admin-init';
  
  const email = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  
  if (!email || !password) {
    logSystemFatal(
      'Root admin credentials are missing in environment variables.',
      { context }
    );
    await handleExit(1);
  }
  
  try {
    logSystemInfo('Initializing root admin account...', { context });
    
    // ------------------------------------------------------------
    // 1. Check existence (structural, no status semantics)
    // ------------------------------------------------------------
    const exists = await userExistsByField('email', email);
    
    if (exists) {
      logSystemWarn('Root admin already exists. Skipping initialization.', {
        context,
        email: maskSensitiveInfo(email, 'email'),
      });
      return;
    }
    
    // ------------------------------------------------------------
    // 2. Resolve role & status (must exist)
    // ------------------------------------------------------------
    const roleId = await resolveRoleIdByName(ROOT_ADMIN_ROLE);
    const statusId = await validateStatus(ACTIVE_STATUS);
    
    // ------------------------------------------------------------
    // 3. Bootstrap actor (explicit system context)
    // ------------------------------------------------------------
    const bootstrapActor = {
      isBootstrap: true,
      isRoot: true,
      isSystem: true,
    };
    
    // ------------------------------------------------------------
    // 4. Validate password strength (bootstrap-only)
    // ------------------------------------------------------------
    validatePasswordStrength(password);
    
    // ------------------------------------------------------------
    // 5. Create root admin (service handles hashing & auth)
    // ------------------------------------------------------------
    const user = await createUserService(
      {
        email,
        password, // plaintext; hashed inside service
        roleId,
        statusId,
        firstname: 'Root',
        lastname: 'Admin',
        phoneNumber: null,
        jobTitle: JOB_TITLE,
        note: 'Initial root admin account',
        statusDate: new Date(),
      },
      bootstrapActor
    );
    
    logSystemInfo('Root admin initialized successfully', {
      context,
      userId: user.id,
      email: maskSensitiveInfo(user.email, 'email'),
    });
  } catch (error) {
    logSystemException(error, 'Root admin initialization failed', { context });
    
    logSystemFatal(
      'Root admin initialization failed — terminating process',
      {
        context,
        errorMessage: error.message,
        stack:
          process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      }
    );
    
    await handleExit(1);
  }
};

module.exports = { initializeRootAdmin };
