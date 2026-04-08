/**
 * @file build-role-filter.js
 * @description SQL WHERE clause builder for role queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Server-injected ACL flags (_excludeSystemRoles, _excludeRootRoles,
 * _excludeAdminRoles, _maxHierarchyLevel) must never come from client input.
 *
 * Exports:
 *  - buildRoleFilter
 */

'use strict';

/**
 * Builds a parameterised SQL WHERE clause for role queries.
 *
 * Status resolution priority:
 *  1. statusIds (array)  — explicit multi-status filter
 *  2. status_id (scalar) — explicit single-status filter
 *  3. _activeStatusId    — server-injected fallback
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.statusIds]              - Filter by status UUIDs.
 * @param {string}   [filters.status_id]              - Filter by status UUID (scalar fallback).
 * @param {string}   [filters._activeStatusId]        - Server-injected status fallback.
 * @param {boolean}  [filters._excludeSystemRoles]    - If true, exclude role named 'system'.
 * @param {boolean}  [filters._excludeRootRoles]      - If true, exclude role named 'root_admin'.
 * @param {boolean}  [filters._excludeAdminRoles]     - If true, exclude role named 'admin'.
 * @param {number}   [filters._maxHierarchyLevel]     - Restrict to roles with hierarchy_level > value.
 * @param {string}   [filters.role_group]             - Exact match on role_group.
 * @param {boolean}  [filters.is_active]              - Filter by active flag.
 * @param {string}   [filters.parent_role_id]         - Filter by parent role UUID.
 * @param {number}   [filters.hierarchy_level]        - Exact match on hierarchy_level.
 * @param {string}   [filters.keyword]                - ILIKE search across name, description, role_group.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildRoleFilter = (filters = {}) => {
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  const statusFilterValue =
    filters.statusIds?.length ? filters.statusIds  :
      filters.status_id         ? filters.status_id  :
        filters._activeStatusId;
  
  if (statusFilterValue != null) {
    conditions.push(
      Array.isArray(statusFilterValue)
        ? `r.status_id = ANY($${paramIndexRef.value}::uuid[])`
        : `r.status_id = $${paramIndexRef.value}`
    );
    params.push(statusFilterValue);
    paramIndexRef.value++;
  }
  
  // ─── ACL Enforcement (server-injected only) ───────────────────────────────────
  
  // These flags restrict visibility based on the caller's role hierarchy.
  // They must never be derived from client input.
  if (filters._excludeSystemRoles) {
    conditions.push(`r.name <> 'system'`);
  }
  
  if (filters._excludeRootRoles) {
    conditions.push(`r.name <> 'root_admin'`);
  }
  
  if (filters._excludeAdminRoles) {
    conditions.push(`r.name <> 'admin'`);
  }
  
  if (filters._maxHierarchyLevel !== undefined) {
    // Only show roles below the caller's hierarchy level.
    conditions.push(`r.hierarchy_level > $${paramIndexRef.value}`);
    params.push(filters._maxHierarchyLevel);
    paramIndexRef.value++;
  }
  
  // ─── Structural ──────────────────────────────────────────────────────────────
  
  if (filters.role_group) {
    conditions.push(`r.role_group = $${paramIndexRef.value}`);
    params.push(filters.role_group);
    paramIndexRef.value++;
  }
  
  if (filters.is_active !== undefined) {
    conditions.push(`r.is_active = $${paramIndexRef.value}`);
    params.push(filters.is_active);
    paramIndexRef.value++;
  }
  
  if (filters.parent_role_id) {
    conditions.push(`r.parent_role_id = $${paramIndexRef.value}`);
    params.push(filters.parent_role_id);
    paramIndexRef.value++;
  }
  
  if (filters.hierarchy_level !== undefined) {
    conditions.push(`r.hierarchy_level = $${paramIndexRef.value}`);
    params.push(filters.hierarchy_level);
    paramIndexRef.value++;
  }
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced three times — single param covers all columns.
  if (filters.keyword) {
    conditions.push(`(
      r.name        ILIKE $${paramIndexRef.value} OR
      r.description ILIKE $${paramIndexRef.value} OR
      r.role_group  ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${filters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildRoleFilter,
};
