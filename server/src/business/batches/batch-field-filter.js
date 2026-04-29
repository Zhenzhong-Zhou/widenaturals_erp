/**
 * @file batch-field-filter.js
 * @description Domain business logic for resolving and filtering editable fields
 * on batch records based on lifecycle state and permission-based access rules.
 */

'use strict';

const AppError = require('../../utils/AppError');

/**
 * Resolves the set of fields a user is permitted to edit on a batch record,
 * based on their access flags and the provided field rule groups.
 *
 * Root users receive access to all fields across all rule groups.
 *
 * @param {object} [access={}] - Resolved ACL flags for the requesting user.
 * @param {boolean} [access.isRoot]
 * @param {boolean} [access.canEditBasicMetadata]
 * @param {boolean} [access.canEditSensitiveMetadata]
 * @param {boolean} [access.canEditReleaseMetadata]
 * @param {boolean} [access.canChangeStatus]
 * @param {object} [rules={}] - Map of rule group keys to arrays of field names.
 * @returns {Set<string>} Set of permitted field names.
 */
const resolveBatchEditableFields = (access = {}, rules = {}) => {
  // Root users bypass permission restrictions — all fields across all rule groups.
  if (access.isRoot) {
    return new Set(Object.values(rules).flat());
  }

  const allowed = new Set();

  const permissionMap = {
    canEditBasicMetadata: 'edit_batch_metadata_basic',
    canEditSensitiveMetadata: 'edit_batch_metadata_sensitive',
    canEditReleaseMetadata: 'edit_batch_release_metadata',
    canChangeStatus: 'change_batch_status',
  };

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
 * Filters an update payload to only the fields permitted by both the batch's
 * current lifecycle state and the user's permission-based access flags.
 *
 * Root users bypass lifecycle restrictions entirely.
 * Throws a `validationError` if any requested field is not permitted, or if
 * no valid fields remain after filtering.
 *
 * @param {object} options
 * @param {object} options.batch - Current batch record (must include `id` and `status_name`).
 * @param {object} [options.updates={}] - Requested update payload from the caller.
 * @param {object} options.access - Resolved ACL flags for the requesting user.
 * @param {Record<string, string[]>} options.editRules - Map of batch status names to
 *   arrays of fields editable in that lifecycle state.
 * @param {(access: object) => Set<string>} options.permissionResolver - Function that
 *   returns the set of fields the user is permitted to edit based on their ACL.
 * @param {string} options.errorLabel - Domain label used in validation error messages
 *   (e.g. `'product batch'`).
 * @returns {object} Filtered update payload containing only permitted fields.
 * @throws {AppError} validationError if the current status has no lifecycle rules,
 *   if any requested fields are not permitted, or if no valid fields remain.
 */
const filterUpdatableBatchFields = ({
  batch,
  updates = {},
  access,
  editRules,
  permissionResolver,
  errorLabel,
}) => {
  // Root users bypass lifecycle restrictions entirely.
  if (access?.isRoot) {
    return { ...updates };
  }

  const lifecycleFields = editRules[batch.status_name] ?? [];

  if (!lifecycleFields.length) {
    throw AppError.validationError(
      `No lifecycle edit rules configured for status: ${batch.status_name}`
    );
  }

  const lifecycleSet = new Set(lifecycleFields);
  const permissionFields = permissionResolver(access);

  // Intersection of lifecycle-permitted and permission-permitted fields.
  const allowedFields = new Set(
    [...lifecycleSet].filter((f) => permissionFields.has(f))
  );

  const invalidFields = Object.keys(updates).filter(
    (f) => !allowedFields.has(f)
  );

  if (invalidFields.length) {
    throw AppError.validationError(
      'Some fields cannot be updated in the current batch state.',
      { details: { invalidFields } }
    );
  }

  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.has(k))
  );

  if (!Object.keys(filtered).length) {
    throw AppError.validationError(
      `No valid editable ${errorLabel} fields provided.`
    );
  }

  return filtered;
};

module.exports = {
  resolveBatchEditableFields,
  filterUpdatableBatchFields,
};
