/**
 * @file sql-ident.js
 * @description
 * SQL identifier safety utilities for PostgreSQL query construction.
 *
 * Provides a single, consistent layer of protection against SQL injection
 * through identifier interpolation (table names, column names, aliases,
 * ORDER BY columns). All functions in this module operate on strings only —
 * no I/O, no pg dependency.
 *
 * Exported surface:
 * - `IDENTIFIER_RE`      — shared regex for PostgreSQL identifier validation
 * - `isSafeIdent`        — predicate; use for filter/guard patterns only
 * - `validateIdentifier` — validate + normalize a single identifier (throws on failure)
 * - `q`                  — validate + double-quote a single identifier for SQL interpolation
 * - `qualify`            — validate + produce a fully-qualified `"schema"."table"` fragment
 * - `safeOrderBy`        — validate a column against a whitelist and return `"col" ASC|DESC`
 * - `assertAllowed`      — enforce schema/table access against the static allowlist
 */

'use strict';

const AppError = require('./AppError');

// ------------------------------------------------------------
// Shared regex
// ------------------------------------------------------------

/**
 * PostgreSQL unquoted identifier pattern.
 *
 * Permits letters, digits, and underscores; must start with a letter
 * or underscore. This intentionally excludes dollar signs and Unicode
 * extensions — we only need to safe-guard application-controlled identifiers.
 *
 * Used by `isSafeIdent`, `validateIdentifier`, and `q` so that the rule
 * is defined exactly once.
 *
 * @type {RegExp}
 */
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ------------------------------------------------------------
// Predicate
// ------------------------------------------------------------

/**
 * Returns `true` if `s` is a safe PostgreSQL identifier.
 *
 * This is a predicate — it returns a boolean and never throws.
 * Use it only when you need to filter or branch on identifier safety
 * without throwing, for example:
 *
 *   const safeCols = requestedColumns.filter(isSafeIdent);
 *
 *   if (!isSafeIdent(col)) {
 *     logSystemWarn('Skipping unsafe column', { col });
 *     continue;
 *   }
 *
 * When you need a hard guarantee (throw on invalid input), use
 * `validateIdentifier` or `q` instead.
 *
 * @param {*} s - Value to test.
 * @returns {boolean}
 */
const isSafeIdent = (s) => IDENTIFIER_RE.test(String(s));

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

/**
 * Validates that `name` is a safe PostgreSQL identifier and returns
 * the trimmed string.
 *
 * Throws a structured `AppError.validationError` on any of:
 * - non-string input
 * - empty or whitespace-only string
 * - characters outside `[a-zA-Z_][a-zA-Z0-9_]*`
 *
 * Use this when you need the validated name as a plain string for
 * further construction (e.g., as a map key, a VALUES placeholder index,
 * or an argument to another builder). When you need a quoted SQL fragment
 * ready for interpolation, use `q` directly.
 *
 * @param {string} name            - Identifier to validate.
 * @param {string} [type='identifier'] - Label used in error messages (e.g., `'column'`, `'table'`).
 * @returns {string} The trimmed, validated identifier.
 * @throws {AppError} If validation fails.
 */
const validateIdentifier = (name, type = 'identifier') => {
  if (typeof name !== 'string') {
    throw AppError.validationError(
      `Invalid ${type}: expected string, received ${typeof name}`
    );
  }
  
  const trimmed = name.trim();
  
  if (!trimmed) {
    throw AppError.validationError(
      `Invalid ${type}: cannot be empty`
    );
  }
  
  if (!isSafeIdent(trimmed)) {
    throw AppError.validationError(
      `Invalid ${type}: "${name}"`
    );
  }
  
  return trimmed;
};

// ------------------------------------------------------------
// Quoting
// ------------------------------------------------------------

/**
 * Validates and double-quotes a PostgreSQL identifier for safe
 * interpolation into a SQL string.
 *
 * Supports both simple identifiers (e.g. `'updated_at'`) and
 * dot-separated qualified references (e.g. `'s.id'`, `'public.users'`).
 * Each segment is validated independently against the identifier regex
 * and quoted with double quotes.
 *
 * For a fully-qualified `"schema"."table"` fragment built from two
 * separate validated inputs, prefer `qualify` instead.
 *
 * @param {string} identifier - An unquoted identifier or dot-separated qualified reference.
 * @returns {string} The double-quoted identifier, e.g. `'"updated_at"'` or `'"s"."id"'`.
 * @throws {AppError} If any segment fails identifier validation.
 *
 * @example
 * q('updated_at')  // → '"updated_at"'
 * q('s.id')        // → '"s"."id"'
 */
const q = (identifier) => {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw AppError.validationError('Invalid SQL identifier', {
      context: 'sql-ident/q',
      meta: { identifier },
    });
  }
  
  // Support qualified identifiers (e.g. 's.id', 'public.users').
  // Each segment is validated and quoted independently.
  const parts = identifier.trim().split('.');
  
  for (const part of parts) {
    if (!isSafeIdent(part)) {
      throw AppError.validationError(`Invalid SQL identifier: "${identifier}"`, {
        context: 'sql-ident/q',
        meta: { identifier },
      });
    }
  }
  
  return parts.map((p) => `"${p}"`).join('.');
};

/**
 * Validates and produces a fully-qualified `"schema"."table"` SQL fragment.
 *
 * Both `schema` and `table` must be provided and must pass identifier
 * validation. Silent fallbacks are intentionally not supported — missing
 * a schema at the call site is a programming error that should surface
 * immediately rather than silently defaulting to `public`.
 *
 * @param {string} schema - Schema name (e.g., `'public'`).
 * @param {string} table  - Table name.
 * @returns {string} A quoted, fully-qualified identifier, e.g. `'"public"."users"'`.
 * @throws {AppError} If either argument is missing or invalid.
 *
 * @example
 * qualify('public', 'users')  // → '"public"."users"'
 */
const qualify = (schema, table) => {
  // Validate both segments explicitly — no silent fallbacks.
  const safeSchema = validateIdentifier(schema, 'schema');
  const safeTable  = validateIdentifier(table,  'table');
  return `${q(safeSchema)}.${q(safeTable)}`;
};

// ------------------------------------------------------------
// ORDER BY safety
// ------------------------------------------------------------

/**
 * Produces a safe `"column" ASC|DESC` ORDER BY fragment.
 *
 * Validates the column against a caller-supplied whitelist Set before
 * quoting. The whitelist is the sole safety control — only columns
 * explicitly listed there can be used for sorting.
 *
 * Supports both simple ('name') and table-qualified ('p.name') column
 * references. Each dot-separated segment is quoted individually.
 *
 * Direction defaults to `'ASC'` for any input other than `'DESC'`
 * (case-insensitive) — unknown values are never passed through.
 *
 * @param {string}      column            - Column name to sort by (must be in whitelistSet).
 * @param {string}      [direction='ASC'] - Sort direction: `'ASC'` or `'DESC'`.
 * @param {Set<string>} whitelistSet      - Allowed column names for this query.
 * @returns {string} Safe ORDER BY fragment, e.g. `'"created_at" DESC'`.
 * @throws {AppError} If the whitelist is empty or the column is not in it.
 *
 * @example
 * safeOrderBy('created_at', 'DESC', new Set(['created_at', 'name']))
 * // → '"created_at" DESC'
 *
 * @example
 * safeOrderBy('p.name', 'ASC', new Set(['p.name', 'created_at']))
 * // → '"p"."name" ASC'
 */
const safeOrderBy = (column, direction = 'ASC', whitelistSet) => {
  const context = 'sql-ident/safeOrderBy';
  
  if (!(whitelistSet instanceof Set) || whitelistSet.size === 0) {
    throw AppError.validationError('Invalid ORDER BY whitelist', { context });
  }
  
  if (!column || !whitelistSet.has(column)) {
    throw AppError.validationError('Invalid ORDER BY column', {
      context,
      meta: { column },
    });
  }
  
  const dir =
    typeof direction === 'string' && direction.toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';
  
  // Column came from the whitelist — quote each segment individually.
  // Supports both simple ('name') and qualified ('p.name') forms.
  const quoted = column
    .split('.')
    .map((part) => `"${part}"`)
    .join('.');
  
  return `${quoted} ${dir}`;
};

// ------------------------------------------------------------
// Table allowlist
// ------------------------------------------------------------

/**
 * Static allowlist of permitted schema/table combinations.
 *
 * This is the authoritative access-control list for `assertAllowed`.
 * Any table accessed via `updateById` or other generic db helpers must
 * appear here. Add new tables as they are introduced to the schema.
 *
 * @type {Readonly<Record<string, Set<string>>>}
 */
const ALLOWED = Object.freeze({
  public: new Set([
    'addresses',
    'audit_action_types',
    'audit_log',
    'auth_action_status',
    'auth_action_types',
    'batch_registry',
    'batch_status',
    'bom_items',
    'boms',
    'compliances',
    'customers',
    'delivery_methods',
    'discounts',
    'entity_types',
    'fulfillment_status',
    'inventory_action_types',
    'inventory_activity_audit_log',
    'inventory_activity_log',
    'inventory_allocation_status',
    'inventory_allocations',
    'inventory_status',
    'inventory_transfer_status',
    'inventory_transfers',
    'knex_migrations',
    'knex_migrations_lock',
    'location_inventory',
    'location_types',
    'locations',
    'login_history',
    'lot_adjustment_types',
    'manufacturers',
    'order_fulfillment',
    'order_items',
    'order_status',
    'order_types',
    'orders',
    'outbound_shipments',
    'packaging_material_batches',
    'packaging_material_suppliers',
    'packaging_materials',
    'part_materials',
    'parts',
    'payment_methods',
    'payment_status',
    'permissions',
    'pricing',
    'pricing_types',
    'batch_activity_logs',
    'product_batches',
    'products',
    'return_items',
    'returns',
    'role_permissions',
    'roles',
    'sales_orders',
    'sessions',
    'shipment_status',
    'sku_code_bases',
    'sku_images',
    'skus',
    'status',
    'status_entity_types',
    'suppliers',
    'tax_rates',
    'token_activity_log',
    'tokens',
    'tracking_numbers',
    'transfer_order_item_status',
    'transfer_order_items',
    'user_auth',
    'users',
    'warehouse_inventory',
    'warehouse_types',
    'warehouse_zones',
    'warehouses',
  ]),
});

/**
 * Asserts that `schema.table` is in the static access-control allowlist.
 *
 * Must be called before any generic database helper (e.g., `updateById`)
 * interpolates a table name into SQL. Both arguments are required —
 * passing `null` or `undefined` for `schema` is a programming error
 * and will throw rather than silently defaulting to `'public'`.
 *
 * @param {string} schema - Schema name (must exist in `ALLOWED`).
 * @param {string} table  - Table name (must exist in `ALLOWED[schema]`).
 * @throws {AppError} If either the schema or table is not in the allowlist.
 *
 * @example
 * assertAllowed('public', 'users');   // passes
 * assertAllowed('public', 'secrets'); // throws ValidationError
 */
const assertAllowed = (schema, table) => {
  // Require an explicit schema — no silent default to 'public'.
  if (!schema || typeof schema !== 'string') {
    throw AppError.validationError(
      `assertAllowed: schema is required. Allowed schemas: ${Object.keys(ALLOWED).join(', ')}`
    );
  }
  
  if (!ALLOWED[schema]) {
    throw AppError.validationError(
      `Schema not allowed: "${schema}". Allowed: ${Object.keys(ALLOWED).join(', ')}`
    );
  }
  
  if (!ALLOWED[schema].has(table)) {
    throw AppError.validationError(`Table not allowed: "${schema}"."${table}"`);
  }
};

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

module.exports = {
  IDENTIFIER_RE,
  isSafeIdent,
  validateIdentifier,
  q,
  qualify,
  safeOrderBy,
  assertAllowed,
};
