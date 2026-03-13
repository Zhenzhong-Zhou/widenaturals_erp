const AppError = require('../../utils/AppError');
const { logSystemInfo } = require('../../utils/system-logger');

/**
 * Resolves which batch fields a user is allowed to edit based on
 * their access permissions and the configured permission field rules.
 *
 * This function converts role-based access flags into a Set of editable
 * field names. The returned Set is later intersected with lifecycle rules
 * to determine the final editable fields.
 *
 * Behavior:
 * - Root users bypass permission restrictions and can edit all fields
 *   defined in the rules object.
 * - Non-root users receive fields based on their access flags.
 * - Missing rule groups are safely ignored.
 *
 * Example rules structure:
 *
 * {
 *   edit_batch_metadata_basic: ['notes', 'manufacture_date'],
 *   edit_batch_metadata_sensitive: ['expiry_date'],
 *   edit_batch_release_metadata: ['released_by', 'released_at'],
 *   change_batch_status: ['status_id']
 * }
 *
 * Example access object:
 *
 * {
 *   isRoot: false,
 *   canEditBasicMetadata: true,
 *   canEditSensitiveMetadata: false,
 *   canEditReleaseMetadata: true,
 *   canChangeStatus: true
 * }
 *
 * @param {Object} access
 * Access control result for the current user.
 *
 * @param {boolean} access.isRoot
 * Indicates whether the user has root privileges.
 *
 * @param {boolean} [access.canEditBasicMetadata]
 * Permission to edit non-sensitive batch metadata.
 *
 * @param {boolean} [access.canEditSensitiveMetadata]
 * Permission to edit sensitive batch metadata.
 *
 * @param {boolean} [access.canEditReleaseMetadata]
 * Permission to edit release-related metadata.
 *
 * @param {boolean} [access.canChangeStatus]
 * Permission to change batch lifecycle status.
 *
 * @param {Record<string, string[]>} rules
 * Mapping of permission groups to editable field arrays.
 *
 * @returns {Set<string>}
 * A Set containing all field names the user is allowed to edit.
 */
const resolveEditableFields = (access = {}, rules = {}) => {
  const allowed = new Set();
  
  //------------------------------------------------------------
  // Root users bypass permission restrictions
  //------------------------------------------------------------
  if (access.isRoot) {
    return new Set(Object.values(rules).flat());
  }
  
  //------------------------------------------------------------
  // Map access flags to rule groups
  //------------------------------------------------------------
  const permissionMap = {
    canEditBasicMetadata: 'edit_batch_metadata_basic',
    canEditSensitiveMetadata: 'edit_batch_metadata_sensitive',
    canEditReleaseMetadata: 'edit_batch_release_metadata',
    canChangeStatus: 'change_batch_status',
  };
  
  //------------------------------------------------------------
  // Resolve allowed fields based on access flags
  //------------------------------------------------------------
  for (const [accessKey, ruleKey] of Object.entries(permissionMap)) {
    if (access[accessKey] && Array.isArray(rules[ruleKey])) {
      for (const field of rules[ruleKey]) {
        allowed.add(field);
      }
    }
  }
  
  return allowed;
};

/**
 * Filters and validates updatable batch fields based on
 * lifecycle state and user permissions.
 *
 * This function enforces two levels of protection:
 *
 * 1. Lifecycle restrictions
 *    Fields that can be edited in the current batch status.
 *
 * 2. Permission restrictions
 *    Fields the current user role is allowed to modify.
 *
 * The final editable fields are the intersection of:
 *
 *    lifecycle rules ∩ permission rules
 *
 * Root users bypass lifecycle restrictions and may update any field.
 *
 * @param {Object} params
 * @param {Object} params.batch
 * Current batch record.
 *
 * @param {Object} params.updates
 * Incoming partial update payload.
 *
 * @param {Object} params.access
 * Access control result for the current user.
 *
 * @param {Record<string, string[]>} params.editRules
 * Editable field whitelist grouped by batch lifecycle status.
 *
 * @param {(access:Object) => Set<string>} params.permissionResolver
 * Function that resolves which fields the user is allowed to edit.
 *
 * @param {string} params.errorLabel
 * Domain label used in validation messages (e.g. "batch").
 *
 * @returns {Object}
 * Sanitized update payload containing only permitted fields.
 *
 * @throws {AppError}
 * When lifecycle rules are missing or invalid fields are requested.
 */
const filterUpdatableBatchFields = ({
                                      batch,
                                      updates = {},
                                      access,
                                      editRules,
                                      permissionResolver,
                                      errorLabel
                                    }) => {
  //------------------------------------------------------------
  // Root users bypass lifecycle restrictions
  //------------------------------------------------------------
  if (access?.isRoot) {
    logSystemInfo('Root override lifecycle restriction', {
      batchId: batch.id,
      updates: Object.keys(updates)
    });
    
    return { ...updates };
  }
  
  //------------------------------------------------------------
  // Resolve lifecycle editable fields
  //------------------------------------------------------------
  const lifecycleFields = editRules[batch.status_name] ?? [];
  
  if (!lifecycleFields.length) {
    throw AppError.validationError(
      `No lifecycle edit rules configured for status: ${batch.status_name}`
    );
  }
  
  //------------------------------------------------------------
  // Convert lifecycle rules to a Set for faster lookup
  //------------------------------------------------------------
  const lifecycleSet = new Set(lifecycleFields);
  
  //------------------------------------------------------------
  // Resolve permission-based editable fields
  //------------------------------------------------------------
  const permissionFields = permissionResolver(access);
  
  //------------------------------------------------------------
  // Intersection of lifecycle + permission rules
  //------------------------------------------------------------
  const allowedFields = new Set(
    [...lifecycleSet].filter((f) => permissionFields.has(f))
  );
  
  //------------------------------------------------------------
  // Validate requested update fields
  //------------------------------------------------------------
  const invalidFields = Object.keys(updates).filter(
    (f) => !allowedFields.has(f)
  );
  
  if (invalidFields.length) {
    throw AppError.validationError(
      'Some fields cannot be updated in the current batch state.',
      { details: { invalidFields } }
    );
  }
  
  //------------------------------------------------------------
  // Filter update payload
  //------------------------------------------------------------
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.has(k))
  );
  
  //------------------------------------------------------------
  // Ensure at least one valid field remains
  //------------------------------------------------------------
  if (!Object.keys(filtered).length) {
    throw AppError.validationError(
      `No valid editable ${errorLabel} fields provided.`
    );
  }
  
  return filtered;
};

module.exports = {
  resolveEditableFields,
  filterUpdatableBatchFields,
};
