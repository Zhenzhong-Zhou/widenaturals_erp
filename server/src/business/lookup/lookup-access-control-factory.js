const { resolveUserPermissionContext } = require('../../services/role-permission-service');
const { logSystemException } = require('../../utils/system-logger');
const AppError = require('../../utils/AppError');

/**
 * Factory to create a lookup access control evaluator.
 *
 * Standardizes permission evaluation across all lookup modules
 * (e.g., suppliers, batches, inventory, customers).
 *
 * This function resolves user permissions once and maps them
 * into a structured access object using a configuration map.
 *
 * ------------------------------------------------------------------
 * Example Usage
 * ------------------------------------------------------------------
 *
 * const evaluateSupplierAccess = createLookupAccessControl({
 *   context: 'supplier-lookup',
 *   permissionsMap: {
 *     canViewAllStatuses: PERMISSIONS.VIEW_ALL_SUPPLIERS,
 *     canViewArchived: PERMISSIONS.VIEW_ARCHIVED_SUPPLIERS,
 *   },
 * });
 *
 * const access = await evaluateSupplierAccess(user);
 *
 * ------------------------------------------------------------------
 *
 * @param {Object} config
 *
 * @param {string} config.context
 *   Logging context identifier.
 *
 * @param {Object<string, string|string[]>} config.permissionsMap
 *   Maps access flags → required permission(s).
 *
 *   Example:
 *   {
 *     canViewAllStatuses: 'VIEW_ALL_SUPPLIERS',
 *     canViewArchived: ['VIEW_ARCHIVED_SUPPLIERS', 'ADMIN_OVERRIDE']
 *   }
 *
 * @returns {(user: object) => Promise<Object>}
 */
const createLookupAccessControl = ({ context, permissionsMap }) => {
  if (!context || typeof context !== 'string') {
    throw new Error('[createLookupAccessControl] Missing or invalid context');
  }
  
  if (!permissionsMap || typeof permissionsMap !== 'object') {
    throw new Error(
      '[createLookupAccessControl] Missing or invalid permissionsMap'
    );
  }
  
  /**
   * Evaluates access control for a given user.
   *
   * @param {object} user
   *
   * @returns {Promise<Object>} accessFlags
   *   Example:
   *   {
   *     canViewAllStatuses: true,
   *     canViewArchived: false
   *   }
   */
  return async (user) => {
    const logContext = `${context}/createLookupAccessControl`;
    
    try {
      const { permissions, isRoot } =
        await resolveUserPermissionContext(user);
      
      //----------------------------------------------------------
      // Build access flags dynamically from config
      //----------------------------------------------------------
      const access = {};
      
      for (const [flag, requiredPermissions] of Object.entries(
        permissionsMap
      )) {
        //--------------------------------------------------------
        // Normalize permission definition to array
        //--------------------------------------------------------
        const required = Array.isArray(requiredPermissions)
          ? requiredPermissions
          : [requiredPermissions];
        
        //--------------------------------------------------------
        // Evaluate access
        //--------------------------------------------------------
        access[flag] =
          isRoot ||
          required.some((perm) => permissions.includes(perm));
      }
      
      return access;
    } catch (err) {
      logSystemException(
        err,
        'Failed to evaluate lookup access control',
        {
          context: logContext,
          userId: user?.id,
        }
      );
      
      throw AppError.businessError(
        'Unable to evaluate lookup access control',
        {
          details: err.message,
          stage: 'lookup-access-evaluation',
        }
      );
    }
  };
};

module.exports = {
  createLookupAccessControl,
};
