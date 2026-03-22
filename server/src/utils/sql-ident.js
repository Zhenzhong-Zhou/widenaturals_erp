const AppError = require('./AppError');

/**
 * SQL identifier safety utilities.
 *
 * These helpers are ONLY for **identifiers** (schema/table/column names).
 * Never use them for values — always parameterize values with `$1, $2, ...`.
 *
 * Usage:
 *   assertAllowed('public', 'skus');          // authorize dynamic table
 *   const tbl = qualify('public', 'skus');    // -> "public"."skus"
 *   const col = q('id');                      // -> "id"
 *   // build SQL safely (values must be parameterized)
 *   const sql = `SELECT ${col} FROM ${tbl} WHERE ${col} = $1`;
 */

/**
 * Test whether a string is a safe SQL identifier (letters, digits, underscore;
 * starts with a letter or underscore). Does NOT check authorization.
 *
 * @param {string} s
 * @returns {boolean}
 */
const isSafeIdent = (s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(s));

/**
 * Quote a SQL identifier safely (`"name"`).
 *
 * Ensures the identifier is strictly alphanumeric with underscores,
 * preventing SQL injection via identifiers.
 *
 * Rules:
 * - Must start with a letter or underscore
 * - Can only contain [a-zA-Z0-9_]
 *
 * @param {string} identifier - Column, table, or schema name
 * @returns {string} Quoted identifier
 *
 * @throws {AppError} validationError if identifier is unsafe
 */
const q = (identifier) => {
  const context = 'sql-ident/q';
  
  if (typeof identifier !== 'string') {
    throw AppError.validationError('Invalid SQL identifier type', {
      context,
      meta: { identifier },
    });
  }
  
  //--------------------------------------------------
  // Strict whitelist validation (NO dots, NO spaces)
  //--------------------------------------------------
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw AppError.validationError(`Unsafe SQL identifier: ${identifier}`, {
      context,
      meta: { identifier },
    });
  }
  
  return `"${identifier}"`;
};

/**
 * Build a safe ORDER BY clause.
 *
 * Enforces:
 * - Column must exist in whitelist
 * - Direction is normalized (ASC/DESC)
 *
 * @param {string} column
 * @param {'ASC'|'DESC'} [direction='ASC']
 * @param {Set<string>} whitelistSet - Allowed columns
 *
 * @returns {string} Safe ORDER BY fragment
 *
 * @throws {AppError}
 */
const safeOrderBy = (
  column,
  direction = 'ASC',
  whitelistSet
) => {
  const context = 'sql-ident/safeOrderBy';
  
  //--------------------------------------------------
  // 1. Validate whitelist
  //--------------------------------------------------
  if (!(whitelistSet instanceof Set) || whitelistSet.size === 0) {
    throw AppError.validationError('Invalid ORDER BY whitelist', {
      context,
    });
  }
  
  //--------------------------------------------------
  // 2. Validate column
  //--------------------------------------------------
  if (!column || !whitelistSet.has(column)) {
    throw AppError.validationError('Invalid ORDER BY column', {
      context,
      meta: { column },
    });
  }
  
  //--------------------------------------------------
  // 3. Normalize direction
  //--------------------------------------------------
  const dir =
    typeof direction === 'string' && direction.toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';
  
  //--------------------------------------------------
  // 4. Return safe SQL
  //--------------------------------------------------
  return `${q(column)} ${dir}`;
};

/**
 * Qualify a table with optional schema, safely quoted.
 *
 * Examples:
 * - qualify(null, 'skus') → `"skus"`
 * - qualify('public', 'skus') → `"public"."skus"`
 *
 * @param {string|null|undefined} schema
 * @param {string} table
 *
 * @returns {string}
 *
 * @throws {AppError}
 */
const qualify = (schema, table) => {
  const context = 'sql-ident/qualify';
  
  //--------------------------------------------------
  // Validate table
  //--------------------------------------------------
  if (!table || typeof table !== 'string') {
    throw AppError.validationError('Table name is required', {
      context,
      meta: { table },
    });
  }
  
  //--------------------------------------------------
  // Validate schema (if provided)
  //--------------------------------------------------
  if (schema === undefined || schema === null) {
    return q(table);
  }
  
  if (typeof schema !== 'string') {
    throw AppError.validationError('Invalid schema name', {
      context,
      meta: { schema },
    });
  }
  
  return `${q(schema)}.${q(table)}`;
};

/**
 * Explicit allowlist of tables you permit for dynamic SQL.
 * Keep this tight; do NOT autopopulate from information_schema.
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
 * Assert that (schema, table) is explicitly allowed for dynamic SQL.
 * Use this BEFORE interpolating identifiers.
 *
 * @param {string|null|undefined} schema - defaults to 'public'
 * @param {string} table
 * @throws {AppError} - validationError if schema/table is not allowlisted
 */
const assertAllowed = (schema, table) => {
  const s = schema || 'public';
  const allowedSchemas = Object.keys(ALLOWED);
  if (!ALLOWED[s]) {
    throw AppError.validationError(
      `Schema not allowed: ${s}. Allowed: ${allowedSchemas.join(', ')}`
    );
  }
  if (!ALLOWED[s].has(table)) {
    throw AppError.validationError(`Table not allowed: ${s}.${table}`);
  }
};

module.exports = {
  isSafeIdent,
  q,
  safeOrderBy,
  qualify,
  assertAllowed,
};
