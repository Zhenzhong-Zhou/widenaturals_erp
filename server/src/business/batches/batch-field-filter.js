const AppError = require('../../utils/AppError');
const { logSystemInfo } = require('../../utils/system-logger');

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
  const allowedFields = [...lifecycleSet].filter((f) =>
    permissionFields.has(f)
  );
  
  //------------------------------------------------------------
  // Validate requested update fields
  //------------------------------------------------------------
  const invalidFields = Object.keys(updates).filter(
    (f) => !allowedFields.includes(f)
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
    Object.entries(updates).filter(([k]) =>
      allowedFields.includes(k)
    )
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
  filterUpdatableBatchFields,
};
