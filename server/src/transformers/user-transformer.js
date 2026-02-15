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
 * Transforms a raw user insert DB row into a service-level user object.
 *
 * @param {Object} row - Raw database row returned from INSERT ... RETURNING
 * @returns {Object} Transformed user object
 */
const transformUserInsertResult = (row) => {
  if (!row) return null;

  return cleanObject({
    id: row.id,
    email: row.email,
    roleId: row.role_id,
    statusId: row.status_id,
    createdAt: row.created_at,
  });
};

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
    return cleanObject({
      id: userRow.id,
      fullName: getFullName(userRow.firstname, userRow.lastname),
      email: userRow.email,
      jobTitle: userRow.job_title,
      roleId: userRow.role_id,
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
  return transformPaginatedResult(paginatedResult, (row) =>
    transformUserForView(row, viewMode)
  );
};

/**
 * @typedef {Object} UserProfileRow
 *
 * ─────────────────────────────
 * Core identity
 * ─────────────────────────────
 * @property {string} id - User UUID
 * @property {string} email - Primary email address
 * @property {string|null} firstname - Given name
 * @property {string|null} lastname - Family name
 *
 * ─────────────────────────────
 * Contact information
 * ─────────────────────────────
 * @property {string|null} phone_number - Contact phone number
 * @property {string|null} job_title - Job title or position
 *
 * ─────────────────────────────
 * System flags
 * ─────────────────────────────
 * @property {boolean} is_system - Whether this is a system / automation user
 *
 * ─────────────────────────────
 * Status (identity state)
 * ─────────────────────────────
 * @property {string} status_id - Status UUID
 * @property {string} status_name - Human-readable status label
 * @property {string|Date} status_date - Timestamp when status was set
 *
 * ─────────────────────────────
 * Role metadata
 * ─────────────────────────────
 * @property {string|null} role_id - Assigned role identifier
 * @property {string|null} role_name - Human-readable role name
 * @property {string|null} role_group - Optional role group
 * @property {number|null} hierarchy_level - Role hierarchy level
 *
 * ─────────────────────────────
 * Derived permissions (aggregated)
 * ─────────────────────────────
 * @property {Array<{
 *   id: string,
 *   key: string,
 *   name: string
 * }>|null} permissions - Derived role permissions (read-only)
 *
 * ─────────────────────────────
 * Profile image (primary avatar)
 * ─────────────────────────────
 * @property {string|null} avatar_url - Profile image URL, if available
 * @property {string|null} avatar_format - Image format (e.g. jpg, png)
 * @property {string|Date|null} avatar_uploaded_at - Avatar upload timestamp
 *
 * ─────────────────────────────
 * Audit metadata (used by makeAudit)
 * ─────────────────────────────
 * @property {string|Date} created_at - Record creation timestamp
 * @property {string|Date} updated_at - Last update timestamp
 * @property {string|null} created_by - Creator user ID
 * @property {string|null} updated_by - Last updater user ID
 */

/**
 * @typedef {Object} UserProfileDTO
 *
 * Core identity
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 *
 * Contact information
 * @property {string=} phoneNumber
 * @property {string=} jobTitle
 *
 * System flags
 * @property {boolean} isSystem
 *
 * Status
 * @property {{
 *   id: string,
 *   name: string,
 *   statusDate?: string|Date
 * }} status
 *
 * Role
 * @property {{
 *   id: string,
 *   name: string,
 *   roleGroup?: string,
 *   hierarchyLevel?: number,
 *   permissions: Array<{
 *     id: string,
 *     key: string,
 *     name: string
 *   }>
 * }=} role
 *
 * Avatar
 * @property {{
 *   url: string,
 *   format?: string,
 *   uploadedAt?: string|Date
 * }=} avatar
 *
 * Audit metadata
 * @property {{
 *   createdAt?: string|Date,
 *   updatedAt?: string|Date,
 *   createdBy?: string,
 *   updatedBy?: string
 * }=} audit
 */

/**
 * Transformer: User Profile
 *
 * Transforms a raw user profile SQL row into a clean API response object.
 *
 * Responsibilities:
 *  - Normalize naming
 *  - Group related fields (status, role, avatar)
 *  - Ensure safe defaults (permissions, avatar)
 *  - Do NOT apply authorization or business rules
 *
 * @param {UserProfileRow|null} row
 * @returns {UserProfileDTO}
 */
const transformUserProfileRow = (row) => {
  if (!row) return null;

  return cleanObject({
    id: row.id,
    email: row.email,

    fullName: getFullName(row.firstname, row.lastname),

    phoneNumber: row.phone_number || null,
    jobTitle: row.job_title || null,

    isSystem: row.is_system,

    status: makeStatus(row),

    role: row.role_id
      ? {
          id: row.role_id,
          name: row.role_name,
          roleGroup: row.role_group || null,
          hierarchyLevel: row.hierarchy_level || null,
          permissions: Array.isArray(row.permissions) ? row.permissions : [],
        }
      : null,

    avatar: row.avatar_url
      ? {
          url: row.avatar_url,
          format: row.avatar_format || null,
          uploadedAt: row.avatar_uploaded_at || null,
        }
      : null,

    audit: compactAudit(makeAudit(row)),
  });
};

module.exports = {
  transformUserInsertResult,
  transformPaginatedUserForViewResults,
  transformUserProfileRow,
};
