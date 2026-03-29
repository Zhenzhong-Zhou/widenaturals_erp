/**
 * @file audit-utils.js
 * @description
 * Audit metadata construction and compaction utilities.
 *
 * Builds normalized audit objects (createdAt/createdBy/updatedAt/updatedBy)
 * from DB rows, with support for column prefixes, custom field maps, deduplication
 * of redundant updated* fields, and compact output for API responses.
 */

'use strict';

const { getFullName } = require('./person-utils');

/**
 * Generic audit metadata structure used internally by transformers.
 *
 * @typedef {Object} AuditMeta
 * @property {string|null} createdAt
 * @property {{ id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }} createdBy
 * @property {string|null} [updatedAt]
 * @property {{ id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }} [updatedBy]
 */

/**
 * @typedef {Object} MakeAuditOptions
 * @property {boolean} [dedupe=true]
 *   Collapses updated* into created* when timestamp and user are identical.
 * @property {string} [prefix]
 *   Column name prefix, e.g. 'order_' → 'order_created_at'.
 * @property {Object} [map]
 *   Explicit field map overriding defaults and prefix. Expected keys:
 *   createdAt, createdById, createdByFirstName, createdByLastName,
 *   updatedAt, updatedById, updatedByFirstName, updatedByLastName.
 * @property {boolean} [includeIds=true]
 *   Include id fields on createdBy / updatedBy.
 * @property {boolean} [includeFullName=true]
 *   Include computed name field on createdBy / updatedBy via getFullName.
 */

/**
 * @typedef {Object} CompactAuditOptions
 * @property {boolean} [keepIds=true]   Retain user.id fields when present.
 * @property {boolean} [nameOnly=true]  Omit firstName/lastName, keep only name.
 */

/**
 * Builds a normalized audit object from a DB row.
 *
 * Field name resolution order: map (highest priority) → prefix → defaults.
 *
 * Dedupe rule (when dedupe=true): drops updated* entirely if createdAt equals
 * updatedAt AND user is the same by id (preferred) or normalized full name.
 * Full-name dedupe runs even when includeFullName=false — names are computed
 * internally for comparison but not retained on the output.
 *
 * @param {Object} row - DB row or row-like object
 * @param {MakeAuditOptions} [opts]
 * @returns {AuditMeta}
 */
const makeAudit = (
  row,
  { dedupe = true, prefix, map, includeIds = true, includeFullName = true } = {}
) => {
  const M = map || {
    createdAt:          prefix ? `${prefix}created_at`           : 'created_at',
    createdById:        prefix ? `${prefix}created_by`           : 'created_by',
    createdByFirstName: prefix ? `${prefix}created_by_firstname` : 'created_by_firstname',
    createdByLastName:  prefix ? `${prefix}created_by_lastname`  : 'created_by_lastname',
    updatedAt:          prefix ? `${prefix}updated_at`           : 'updated_at',
    updatedById:        prefix ? `${prefix}updated_by`           : 'updated_by',
    updatedByFirstName: prefix ? `${prefix}updated_by_firstname` : 'updated_by_firstname',
    updatedByLastName:  prefix ? `${prefix}updated_by_lastname`  : 'updated_by_lastname',
  };
  
  const v = (k) => row?.[k] ?? null;
  
  const createdBy = {
    ...(includeIds ? { id: v(M.createdById) } : {}),
    firstName: v(M.createdByFirstName),
    lastName:  v(M.createdByLastName),
  };
  
  const updatedBy = {
    ...(includeIds ? { id: v(M.updatedById) } : {}),
    firstName: v(M.updatedByFirstName),
    lastName:  v(M.updatedByLastName),
  };
  
  const createdAtRaw = v(M.createdAt);
  const updatedAtRaw = v(M.updatedAt);
  
  // Normalize timestamps to a comparable key regardless of whether the DB
  // returns a Date object or an ISO string
  const toKey = (t) => {
    if (t == null) return null;
    if (t instanceof Date) return t.getTime();
    return String(t);
  };
  
  const createdAtKey = toKey(createdAtRaw);
  const updatedAtKey = toKey(updatedAtRaw);
  
  if (includeFullName) {
    createdBy.name = getFullName(createdBy.firstName, createdBy.lastName);
    updatedBy.name = getFullName(updatedBy.firstName, updatedBy.lastName);
  }
  
  const audit = {
    createdAt: createdAtRaw,
    createdBy,
    ...(updatedAtRaw !== null ||
    updatedBy.firstName !== null ||
    updatedBy.lastName !== null ||
    (includeIds && 'id' in updatedBy && updatedBy.id !== undefined)
      ? { updatedAt: updatedAtRaw, updatedBy }
      : {}),
  };
  
  if (!dedupe) return audit;
  
  const sameTime = createdAtKey != null && createdAtKey === updatedAtKey;
  
  const sameUserById =
    includeIds &&
    audit.createdBy?.id != null &&
    audit.updatedBy?.id != null &&
    String(audit.createdBy.id) === String(audit.updatedBy.id);
  
  // Name-based dedupe runs even when includeFullName=false — names are
  // computed here only for comparison, not added to the output
  const norm = (s) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : s || '');
  const sameUserByName =
    norm(getFullName(audit.createdBy?.firstName, audit.createdBy?.lastName)) ===
    norm(getFullName(audit.updatedBy?.firstName, audit.updatedBy?.lastName));
  
  if (sameTime && (sameUserById || sameUserByName)) {
    // updated* is redundant — drop it entirely to avoid duplicate audit data
    return {
      createdAt: audit.createdAt,
      createdBy: { ...audit.createdBy },
    };
  }
  
  return audit;
};

/**
 * Produces a compact audit payload for UI or API responses.
 *
 * Always includes created*. Only includes updated* if present on the input
 * (i.e. not deduped away by makeAudit). Prunes id and/or firstName/lastName
 * fields based on options.
 *
 * @param {AuditMeta|null} audit
 * @param {CompactAuditOptions} [opts]
 * @returns {AuditMeta|null}
 */
const compactAudit = (audit, { keepIds = true, nameOnly = true } = {}) => {
  if (!audit) return audit;
  
  const pruneUser = (u = {}) => {
    const out = {};
    if (keepIds && 'id' in u) out.id = u.id ?? null;
    if ('name' in u) out.name = u.name ?? null;
    if (!nameOnly) {
      if ('firstName' in u) out.firstName = u.firstName ?? null;
      if ('lastName' in u) out.lastName = u.lastName ?? null;
    }
    return out;
  };
  
  const collapsed = {
    createdAt: audit.createdAt ?? null,
    createdBy: pruneUser(audit.createdBy),
  };
  
  if ('updatedAt' in audit || 'updatedBy' in audit) {
    collapsed.updatedAt = audit.updatedAt ?? null;
    collapsed.updatedBy = pruneUser(audit.updatedBy);
  }
  
  return collapsed;
};

module.exports = {
  makeAudit,
  compactAudit,
};
