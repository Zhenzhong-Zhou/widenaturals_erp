/**
 * @file user-types.js
 * @description JSDoc typedefs for the user domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the user insert query.
 *
 * @typedef {Object} UserInsertRow
 * @property {string}      id
 * @property {string}      email
 * @property {string}      role_id
 * @property {string}      status_id
 * @property {string}      created_at
 */

/**
 * Raw DB row returned by paginated and card/list user queries.
 *
 * @typedef {Object} UserRow
 * @property {string}      id
 * @property {string|null} firstname
 * @property {string|null} lastname
 * @property {string}      email
 * @property {string|null} phone_number
 * @property {string|null} job_title
 * @property {string}      role_id
 * @property {string|null} role_name
 * @property {string|null} status_id
 * @property {string|null} status_name
 * @property {string|null} status_date
 * @property {string|null} avatar_url
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {string|null} created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * @typedef {Omit<UserRow, 'role_id' | 'role_name' | 'role_group' | 'hierarchy_level' | 'permissions'> & {
 *   role_id:         null,
 *   role_name:       null,
 *   role_group:      null,
 *   hierarchy_level: null,
 *   permissions:     null,
 * }} UserRowRoleRedacted
 */

/**
 * Raw DB row returned by user profile queries (includes role join).
 *
 * @typedef {UserRow & {
 *   role_group?:      string|null,
 *   hierarchy_level?: number|null,
 *   permissions?:     string|null,
 * }} UserProfileRow
 */

/**
 * Raw DB row returned by the user profile query.
 *
 * @typedef {Object} UserProfileRow
 * @property {string}       id
 * @property {string}       email
 * @property {string|null}  firstname
 * @property {string|null}  lastname
 * @property {string|null}  phone_number
 * @property {string|null}  job_title
 * @property {boolean}      is_system
 * @property {string|null}  status_id
 * @property {string|null}  status_name
 * @property {string|null}  status_date
 * @property {string|null}  role_id
 * @property {string|null}  role_name
 * @property {string|null}  role_group
 * @property {number|null}  hierarchy_level
 * @property {Array}        permissions
 * @property {string|null}  avatar_url
 * @property {string|null}  avatar_format
 * @property {string|null}  avatar_uploaded_at
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed user insert result — minimal shape returned after creation.
 *
 * @typedef {Object} UserInsertRecord
 * @property {string} id
 * @property {string} email
 * @property {string} roleId
 * @property {string} statusId
 * @property {string} createdAt
 */

/**
 * Transformed user row for list view (table).
 *
 * @typedef {Object} UserListRecord
 * @property {string}      id
 * @property {string|null} fullName
 * @property {string}      email
 * @property {string|null} phoneNumber
 * @property {string|null} jobTitle
 * @property {string}      roleId
 * @property {string|null} roleName
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {Object}      audit
 * @property {string|null} avatarUrl
 */

/**
 * Transformed user row for card view (compact layout).
 *
 * @typedef {Object} UserCardRecord
 * @property {string}      id
 * @property {string|null} fullName
 * @property {string}      email
 * @property {string|null} jobTitle
 * @property {string}      roleId
 * @property {string|null} roleName
 * @property {string|null} statusName
 * @property {string|null} avatarUrl
 */

/**
 * Transformed user profile record.
 *
 * @typedef {Object} UserProfileRecord
 * @property {string}       id
 * @property {string}       email
 * @property {string|null}  fullName
 * @property {string|null}  phoneNumber
 * @property {string|null}  jobTitle
 * @property {boolean}      isSystem
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {{
 *   id: string,
 *   name: string|null,
 *   roleGroup: string|null,
 *   hierarchyLevel: number|null,
 *   permissions: Array
 * }|null} role
 * @property {{
 *   url: string,
 *   format: string|null,
 *   uploadedAt: string|null
 * }|null} avatar
 * @property {Object} audit
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} UserCreationAcl
 * @property {boolean} canCreateUsers
 * @property {boolean} canCreateAdminUsers
 * @property {boolean} canCreateSystemUsers
 * @property {boolean} canCreateRootUsers
 */

/**
 * @typedef {object} UserVisibilityAcl
 * @property {boolean} canViewSystemUsers
 * @property {boolean} canViewRootUsers
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewAllUsers
 * @property {boolean} enforceActiveOnly
 */

/**
 * @typedef {object} UserProfileAcl
 * @property {boolean} isSelf
 * @property {boolean} canViewProfile
 */

/**
 * @typedef {object} UserRoleAcl
 * @property {boolean} canViewRole
 */

/**
 * @typedef {object} UserLookupSearchAcl
 * @property {boolean} canSearchRole
 * @property {boolean} canSearchStatus
 */
