/**
 * @file user-transformer.js
 * @description Row-level and page-level transformers for user records.
 *
 * Exports:
 *   - transformUserInsertResult              – minimal shape returned after user creation
 *   - transformPaginatedUserForViewResults   – paginated user list (card or list view)
 *   - transformUserProfileRow                – full user profile with role and avatar
 *
 * Internal helpers (not exported):
 *   - transformUserForView – per-row transformer dispatching on viewMode
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject }             = require('../utils/object-utils');
const { getFullName }             = require('../utils/person-utils');
const { makeStatus }              = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult }     = require('../utils/transformer-utils');

/**
 * Transforms a user insert DB row into the minimal post-creation response shape.
 *
 * @param {UserInsertRow} row
 * @returns {UserInsertRecord|null}
 */
const transformUserInsertResult = (row) => {
  if (!row) return null;
  
  return cleanObject({
    id:        row.id,
    email:     row.email,
    roleId:    row.role_id,
    statusId:  row.status_id,
    createdAt: row.created_at,
  });
};

/**
 * Transforms a single user DB row into either a card or list view shape.
 *
 * - `'card'` – minimal identity summary for compact layouts
 * - `'list'` – full display model for tables (default)
 *
 * Returns `null` if the row is falsy.
 *
 * @param {UserRow}  userRow
 * @param {string}   [viewMode='list']
 * @returns {UserCardRecord|UserListRecord|null}
 */
const transformUserForView = (userRow, viewMode) => {
  if (!userRow) return null;
  
  if (viewMode === 'card') {
    return cleanObject({
      id:         userRow.id,
      fullName:   getFullName(userRow.firstname, userRow.lastname),
      email:      userRow.email,
      jobTitle:   userRow.job_title,
      roleId:     userRow.role_id,
      roleName:   userRow.role_name,
      statusName: userRow.status_name,
      avatarUrl:  userRow.avatar_url,
    });
  }
  
  return cleanObject({
    id:          userRow.id,
    fullName:    getFullName(userRow.firstname, userRow.lastname),
    email:       userRow.email,
    phoneNumber: userRow.phone_number,
    jobTitle:    userRow.job_title,
    roleId:      userRow.role_id,
    roleName:    userRow.role_name,
    status:      makeStatus(userRow),
    audit:       compactAudit(makeAudit(userRow)),
    avatarUrl:   userRow.avatar_url,
  });
};

/**
 * Transforms a paginated user result set into the card or list view shape.
 *
 * Delegates per-row transformation to `transformUserForView` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}    paginatedResult
 * @param {UserRow[]} paginatedResult.data
 * @param {Object}    paginatedResult.pagination
 * @param {string}    [viewMode='list']
 * @returns {Promise<PaginatedResult<UserRow>>}
 */
const transformPaginatedUserForViewResults = (paginatedResult, viewMode) =>
  /** @type {Promise<PaginatedResult<UserRow>>} */
  (transformPageResult(paginatedResult, (row) =>
    transformUserForView(row, viewMode)
  ));

/**
 * Transforms a user profile DB row into the full profile response shape.
 *
 * Includes role (when visible), avatar (always public), status, and audit fields.
 * Returns `null` if the row is falsy.
 *
 * @param {UserProfileRow} row
 * @returns {UserProfileRecord|null}
 */
const transformUserProfileRow = (row) => {
  if (!row) return null;
  
  return cleanObject({
    id:          row.id,
    email:       row.email,
    fullName:    getFullName(row.firstname, row.lastname),
    phoneNumber: row.phone_number  ?? null,
    jobTitle:    row.job_title     ?? null,
    isSystem:    row.is_system,
    status:      makeStatus(row),
    
    role: row.role_id
      ? {
        id:             row.role_id,
        name:           row.role_name        ?? null,
        roleGroup:      row.role_group        ?? null,
        hierarchyLevel: row.hierarchy_level   ?? null,
        permissions:    Array.isArray(row.permissions) ? row.permissions : [],
      }
      : null,
    
    // Avatar visibility is intentionally public for all users.
    avatar: row.avatar_url
      ? {
        url:        row.avatar_url,
        format:     row.avatar_format      ?? null,
        uploadedAt: row.avatar_uploaded_at ?? null,
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
