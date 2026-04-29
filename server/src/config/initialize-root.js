/**
 * @file initialize-root-admin.js
 * @description Bootstrap module responsible for creating the root admin account
 * on first system startup. Runs outside the request lifecycle — no req/res context.
 *
 * Follows a fail-fast strategy: any unrecoverable error terminates the process
 * via handleExit to prevent the system starting in a broken state.
 *
 * @module bootstrap/initialize-root-admin
 */

'use strict';

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
 * Initializes the root admin account if one does not already exist.
 * Intended to run once during system bootstrap before the HTTP server starts.
 *
 * Steps:
 *  1. Validate required env vars (ROOT_ADMIN_EMAIL, ROOT_ADMIN_PASSWORD)
 *  2. Skip if root admin already exists (idempotent)
 *  3. Resolve root admin role ID from DB
 *  4. Validate password strength
 *  5. Delegate creation to createUserService with a bootstrap actor
 *
 * @returns {Promise<void>}
 */
const initializeRootAdmin = async () => {
  const context = 'bootstrap.root-admin';

  const rawEmail = process.env.ROOT_ADMIN_EMAIL;
  const password = process.env.ROOT_ADMIN_PASSWORD;

  // ── 1. Validate env vars ─────────────────────────────────────────────────
  // Both are required — abort immediately if missing rather than proceeding
  // with a broken state.
  if (!rawEmail || !password) {
    logSystemFatal(
      'Root admin credentials are missing in environment variables.',
      { context }
    );
    await handleExit(1);
    return; // Unreachable in practice — satisfies static analysis.
  }

  const email = rawEmail.trim().toLowerCase();

  try {
    logSystemInfo('Initializing root admin account...', { context, email });

    // ── 2. Idempotency check ───────────────────────────────────────────────
    // Safe to run on every startup — skips silently if already initialized.
    const userExists = await userExistsByField('email', email);

    if (userExists) {
      logSystemWarn('Root admin already exists. Skipping initialization.', {
        context,
        email,
      });
      return;
    }

    // ── 3. Resolve role ────────────────────────────────────────────────────
    // Role must exist before any user can be created — seeded in DB migrations.
    const roleId = await resolveRoleIdByName(ROOT_ADMIN_ROLE);

    if (!roleId) {
      // Non-recoverable invariant: system cannot function without this role.
      throw AppError.initializationError(
        `Root admin role not found: "${ROOT_ADMIN_ROLE}". Ensure DB migrations have run.`
      );
    }

    // ── 4. Validate password ───────────────────────────────────────────────
    // Fail fast before hitting the DB if the configured password is too weak.
    validatePasswordStrength(password);

    // ── 5. Bootstrap actor ─────────────────────────────────────────────────
    // System-level actor — not a real user session. The sentinel id identifies
    // this as a non-human, non-request actor in audit logs.
    // isBootstrap bypasses normal ACL checks in the service layer.
    /** @type {SystemActor} */
    const bootstrapActor = {
      isBootstrap: true,
      isRoot: true,
      isSystem: true,
    };

    // ── 6. Create root admin ───────────────────────────────────────────────
    // Password is intentionally plaintext here — hashing is handled inside
    // createUserService to keep security logic centralized.
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

    logSystemInfo('Root admin initialized successfully.', {
      context,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    // Authoritative crash log — logger normalizes AppError vs unknown errors.
    // Always terminates: a failed bootstrap means the system is unusable.
    logSystemCrash(
      error,
      'Root admin initialization failed — terminating process.',
      { context }
    );

    await handleExit(1);
  }
};

module.exports = {
  initializeRootAdmin,
};
