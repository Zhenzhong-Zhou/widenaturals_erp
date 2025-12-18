/**
 * Presentation-layer transformers.
 *
 * Pure, stateless utilities for reshaping domain records into
 * UI-consumable response formats.
 *
 * Characteristics:
 * - Stateless and side effect free
 * - Does NOT enforce permissions, visibility rules, or business logic
 * - Assumes input data has already been filtered and authorized
 * - Responsible only for response shape, field selection, and formatting
 */

const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * @typedef {Object} UserRow
 *
 * Core identity
 * @property {string} id - User UUID
 * @property {string} firstname - Given name
 * @property {string} lastname - Family name
 *
 * Contact information
 * @property {string} email - Primary email address
 * @property {string} phone_number - Contact phone number
 *
 * Role & status
 * @property {string} role_id - Assigned role identifier
 * @property {string} role_name - Human-readable role name
 * @property {string} job_title - Job title or position
 * @property {string} status_name - Current user status label
 *
 * Profile
 * @property {string|null} avatar_url - Profile image URL, if available
 *
 * Audit metadata (used by makeAudit)
 * @property {string} created_at - Record creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {string} created_by - Creator user ID
 * @property {string} updated_by - Last updater user ID
 */

/**
 * Transform a single user row into a UI-specific representation.
 *
 * Responsibility:
 * - Select and rename fields for presentation
 * - Aggregate or derive display-friendly values
 * - Remove empty or undefined properties
 *
 * This function:
 * - MUST NOT enforce permissions or visibility rules
 * - MUST NOT perform filtering or business logic
 * - Assumes the input row is already authorized
 *
 * @param {UserRow} userRow - Raw user row from repository
 * @param {'list' | 'card'} viewMode - UI presentation mode
 * @returns {Object} Transformed user object for UI consumption
 */
const transformUserForView = (userRow, viewMode) => {
  // Card view → minimal identity summary for compact layouts
  if (viewMode === 'card') {
    return cleanObject( {
      id: userRow.id,
      fullName: getFullName(userRow.firstname, userRow.lastname),
      jobTitle: userRow.job_title,
      roleName: userRow.role_name,
      statusName: userRow.status_name,
      avatarUrl: userRow.avatar_url,
    });
  }

  // List view → full display model for tables (default)
  return cleanObject({
    id: userRow.id,
    fullName: getFullName(userRow.firstname, userRow.lastname),
    email: userRow.email,
    phoneNumber: userRow.phone_number,
    jobTitle: userRow.job_title,
    
    roleId: userRow.role_id,
    roleName: userRow.role_name,
    
    status: makeStatus(userRow),
    
    audit: compactAudit(makeAudit(userRow)),
    
    avatarUrl: userRow.avatar_url,
  });
};

/**
 * Transform a paginated user result set into a UI-specific shape.
 *
 * Responsibility:
 * - Preserve pagination metadata
 * - Apply view-specific transformation to each row
 *
 * This function:
 * - Does NOT alter pagination structure
 * - Delegates row transformation to transformUserForView()
 *
 * @param {Object} paginatedResult - Paginated repository result
 * @param {'list' | 'card'} viewMode - UI presentation mode
 * @returns {Object} Paginated response with transformed rows
 */
const transformPaginatedUserForViewResults = (paginatedResult, viewMode) => {
  return transformPaginatedResult(
    paginatedResult,
    (row) => transformUserForView(row, viewMode)
  );
};

module.exports = {
  transformPaginatedUserForViewResults,
};
