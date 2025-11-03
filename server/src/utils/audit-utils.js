const { getFullName } = require('./name-utils');

/**
 * @typedef {Object} MakeAuditOptions
 * @property {boolean} [dedupe=true]            When true, collapses updated* into created* if same timestamp + same user.
 * @property {string}  [prefix]                 Prefix for column names, e.g. "order_" -> "order_created_at".
 * @property {Object}  [map]                    Explicit field map (overrides defaults/prefix). Keys below are expected:
 *                                              { createdAt, createdById, createdByFirstName, createdByLastName,
 *                                                updatedAt, updatedById, updatedByFirstName, updatedByLastName }
 * @property {boolean} [includeIds=true]        Include createdBy / updatedBy when available.
 * @property {boolean} [includeFullName=true]   Include createdBy.name / updatedBy.name via getFullName.
 *
 * @typedef {Object} CompactAuditOptions
 * @property {boolean} [keepIds=true]           Keep user.id fields when present.
 * @property {boolean} [nameOnly=true]          Only keep user.name (omit firstName/lastName) when true.
 *
 * Build a normalized audit object from a DB row (or any row-like object).
 * Resolution order for field names: `map` (highest) → `prefix` → normalized defaults.
 *
 * Dedupe rule (when `dedupe=true`):
 * - Only dedupes if `createdAt` equals `updatedAt` (string equality or normalized date equality)
 * - AND user is the same by id (preferred) or by normalized full name.
 *
 * Edge cases:
 * - If `includeFullName=false`, full-name-based dedupe still works (names are computed internally but not kept).
 * - If IDs are missing, name-based dedupe is used.
 * - If only `created*` exists, `updated*` is omitted.
 *
 * @param {object} row
 * @param {MakeAuditOptions} [opts]
 * @returns {{
 *   createdAt: string|null,
 *   createdBy: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null },
 *   updatedAt?: string|null,
 *   updatedBy?: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }
 * }}
 */
const makeAudit = (
  row,
  { dedupe = true, prefix, map, includeIds = true, includeFullName = true } = {}
) => {
  const safeFullName = (fn, ln) => {
    // If a global getFullName exists, use it; otherwise fallback.
    if (typeof getFullName === 'function') return getFullName(fn, ln);
    const parts = [fn, ln]
      .filter(Boolean)
      .map((s) => String(s).trim())
      .filter(Boolean);
    return parts.join(' ') || '';
  };

  const M = map || {
    createdAt: prefix ? `${prefix}created_at` : 'created_at',
    createdById: prefix ? `${prefix}created_by` : 'created_by',
    createdByFirstName: prefix
      ? `${prefix}created_by_firstname`
      : 'created_by_firstname',
    createdByLastName: prefix
      ? `${prefix}created_by_lastname`
      : 'created_by_lastname',
    updatedAt: prefix ? `${prefix}updated_at` : 'updated_at',
    updatedById: prefix ? `${prefix}updated_by` : 'updated_by',
    updatedByFirstName: prefix
      ? `${prefix}updated_by_firstname`
      : 'updated_by_firstname',
    updatedByLastName: prefix
      ? `${prefix}updated_by_lastname`
      : 'updated_by_lastname',
  };

  const v = (k) => row?.[k] ?? null;

  const createdBy = {
    ...(includeIds ? { id: v(M.createdById) } : {}),
    firstName: v(M.createdByFirstName),
    lastName: v(M.createdByLastName),
  };
  const updatedBy = {
    ...(includeIds ? { id: v(M.updatedById) } : {}),
    firstName: v(M.updatedByFirstName),
    lastName: v(M.updatedByLastName),
  };

  const createdAtRaw = v(M.createdAt);
  const updatedAtRaw = v(M.updatedAt);

  // Normalize time for equality checks (supports Date or string)
  const toKey = (t) => {
    if (t == null) return null;
    if (t instanceof Date) return t.getTime();
    // assume ISO/string. If DB returns identical strings, direct compare works.
    return String(t);
  };
  const createdAtKey = toKey(createdAtRaw);
  const updatedAtKey = toKey(updatedAtRaw);

  if (includeFullName) {
    createdBy.name = safeFullName(createdBy.firstName, createdBy.lastName);
    updatedBy.name = safeFullName(updatedBy.firstName, updatedBy.lastName);
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

  const norm = (s) =>
    typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : s || '';
  const createdName = safeFullName(
    audit.createdBy?.firstName,
    audit.createdBy?.lastName
  );
  const updatedName = safeFullName(
    audit.updatedBy?.firstName,
    audit.updatedBy?.lastName
  );
  const sameUserByName = norm(createdName) === norm(updatedName);

  if (sameTime && (sameUserById || sameUserByName)) {
    // If updated* was redundant, drop it entirely.
    return {
      createdAt: audit.createdAt,
      createdBy: { ...audit.createdBy },
    };
  }

  return audit;
};

/**
 * Produce a compact audit payload for UI or API responses.
 *
 * Keeps `created*` always. Only includes `updated*` if present on input
 * (i.e., not deduped away). Can prune ids and/or first/last names.
 *
 * @param {{
 *   createdAt: string|null,
 *   createdBy: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null },
 *   updatedAt?: string|null,
 *   updatedBy?: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }
 * } | null} audit
 * @param {{ keepIds?: boolean, nameOnly?: boolean }} [opts]
 * @returns {{
 *   createdAt: string|null,
 *   createdBy: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null },
 *   updatedAt?: string|null,
 *   updatedBy?: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }
 * }}
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
