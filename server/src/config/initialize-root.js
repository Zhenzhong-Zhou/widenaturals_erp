/**
 * @file initialize-root-admin.js
 * @description Root admin bootstrap module.
 *
 * Responsibilities:
 * - Provide initialization logic for creating the root admin account
 * - Ensure system startup has a valid root-level user
 *
 * Context:
 * - Part of system bootstrap phase (runs before application is fully operational)
 * - Executes outside request lifecycle (no req/res context)
 *
 * Design:
 * - Delegates user creation to service layer
 * - Uses system logger for all observability
 * - Follows fail-fast strategy for startup-critical operations
 */

const { handleExit } = require('../system/lifecycle/on-exit');
const {
  logSystemFatal,
  logSystemInfo,
  logSystemWarn,
  logSystemCrash,
} = require('../utils/logging/system-logger');
const { userExistsByField } = require('../repositories/user-repository');
const { resolveRoleIdByName } = require('../repositories/role-repository');
const {
  ROOT_ADMIN_ROLE,
  JOB_TITLE,
} = require('../utils/constants/general/root-admin');
const { createUserService } = require('../services/user-service');
const { validatePasswordStrength } = require('../security/password-policy');
const AppError = require('../utils/AppError');

/**
 * Initializes the root admin account if it does not already exist.
 *
 * Behavior:
 * - Idempotent: skips creation if a root admin already exists
 * - Validates required environment variables and password strength
 * - Resolves required role before creation
 * - Uses a bootstrap actor to bypass standard ACL checks
 *
 * Failure Strategy:
 * - Missing env or invalid system state → logs fatal error and exits process
 * - Any runtime failure → logs crash and exits process
 *
 * Invariants:
 * - ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD must be defined
 * - ROOT_ADMIN_ROLE must exist in the system
 * - Password must satisfy defined security policy
 *
 * @returns {Promise<void>}
 */
const initializeRootAdmin = async () => {
  const context = 'bootstrap.root-admin';
  
  const rawEmail = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;
  
  // ------------------------------------------------------------
  // 1. Validate required environment variables (startup-critical)
  // ------------------------------------------------------------
  if (!rawEmail || !password) {
    logSystemFatal(
      'Root admin credentials are missing in environment variables.',
      { context }
    );
    await handleExit(1);
  }
  
  const email = rawEmail.trim().toLowerCase();
  
  try {
    logSystemInfo('Initializing root admin account...', { context, email });
    
    // ------------------------------------------------------------
    // 2. Check existence (idempotent bootstrap)
    // ------------------------------------------------------------
    const userExists = await userExistsByField('email', email);
    
    if (userExists) {
      logSystemWarn('Root admin already exists. Skipping initialization.', {
        context,
        email,
      });
      return;
    }
    
    // ------------------------------------------------------------
    // 3. Resolve required role (hard invariant)
    // ------------------------------------------------------------
    const roleId = await resolveRoleIdByName(ROOT_ADMIN_ROLE);
    
    // This is a non-recoverable system invariant:
    // the system cannot function without a root admin role.
    if (!roleId) {
      throw AppError.initializationError(
        `Root admin role not found: ${ROOT_ADMIN_ROLE}`
      );
    }
    
    // ------------------------------------------------------------
    // 4. Bootstrap actor (system-level ACL bypass)
    // ------------------------------------------------------------
    const bootstrapActor = {
      isBootstrap: true,
      isRoot: true,
      isSystem: true,
    };
    
    // ------------------------------------------------------------
    // 5. Validate password strength (fail-fast security check)
    // ------------------------------------------------------------
    validatePasswordStrength(password);
    
    // ------------------------------------------------------------
    // 6. Create root admin
    // NOTE:
    // - Password is intentionally plaintext here
    // - Hashing and security handling are delegated to the service layer
    // ------------------------------------------------------------
    const user = await createUserService(
      {
        email,
        password,
        roleId,
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
      email: user.email,
    });
  } catch (error) {
    // Single authoritative crash log (logger handles normalization)
    logSystemCrash(
      error,
      'Root admin initialization failed — terminating process',
      { context }
    );
    
    await handleExit(1);
  }
};

module.exports = {
  initializeRootAdmin,
};
