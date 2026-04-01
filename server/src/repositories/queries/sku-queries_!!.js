const { minUuid } = require('../../utils/sql/sql-helpers');

// ─── Module-level constants ────────────────────────────────────────────────────
// These arrays are identical on every call for a given allowAllSkus value.
// Building them once at load time avoids repeated array allocation per request.

const TABLE_NAME = 'skus s';

/**
 * Base join — always included regardless of access level.
 * Links every SKU to its parent product.
 */
const BASE_JOINS = [
  'LEFT JOIN products p ON s.product_id = p.id',
];

/**
 * Extended joins for privileged access (allowAllSkus = true).
 *
 * Uses LEFT JOIN LATERAL instead of two independent join chains to eliminate
 * the Cartesian row multiplication that occurs when a SKU has multiple warehouse
 * and location inventory rows simultaneously.
 *
 * Old pattern (8 joins, W × L row explosion per SKU):
 *   skus → pb_wi → br_wi → wi
 *   skus → pb_li → br_li → li
 *   skus → br (COALESCE) → pb → batch_status   ← ambiguous, fragile
 *
 * New pattern (LATERAL, 1 row per SKU per subquery, no multiplication):
 *   wi_sub  — fetches warehouse inventory status for this SKU
 *   li_sub  — fetches location inventory status for this SKU
 *   pb_sub  — fetches batch status for this SKU via whichever inventory exists
 *
 * Each LATERAL subquery is correlated on pb.sku_id = s.id and uses LIMIT 1,
 * so PostgreSQL executes it once per outer row and returns at most one result.
 * GROUP BY s.id + MIN() in the outer query are preserved for other multi-row
 * relationships (e.g. product → multiple SKUs), but the inventory chains no
 * longer multiply rows before the GROUP BY executes.
 */
const PRIVILEGED_JOINS = [
  ...BASE_JOINS,
  
  // SKU and product status labels
  'LEFT JOIN status sku_status     ON sku_status.id     = s.status_id',
  'LEFT JOIN status product_status ON product_status.id = p.status_id',
  
  // Warehouse inventory status — correlated, returns at most 1 row per SKU
  `LEFT JOIN LATERAL (
    SELECT wi.status_id AS warehouse_status_id
    FROM   product_batches pb
    JOIN   batch_registry br         ON br.product_batch_id = pb.id
    JOIN   warehouse_inventory wi    ON wi.batch_id         = br.id
    WHERE  pb.sku_id = s.id
    LIMIT  1
  ) wi_sub ON true`,
  
  // Location inventory status — correlated, returns at most 1 row per SKU
  `LEFT JOIN LATERAL (
    SELECT li.status_id AS location_status_id
    FROM   product_batches pb
    JOIN   batch_registry br         ON br.product_batch_id = pb.id
    JOIN   location_inventory li     ON li.batch_id         = br.id
    WHERE  pb.sku_id = s.id
    LIMIT  1
  ) li_sub ON true`,
  
  // Batch status — resolves via whichever inventory chain has a hit first.
  // Replaces the fragile COALESCE(wi.batch_id, li.batch_id) join from the old pattern.
  `LEFT JOIN LATERAL (
    SELECT pb.status_id AS batch_status_id
    FROM   product_batches pb
    JOIN   batch_registry br         ON br.product_batch_id = pb.id
    LEFT JOIN warehouse_inventory wi ON wi.batch_id         = br.id
    LEFT JOIN location_inventory  li ON li.batch_id         = br.id
    WHERE  pb.sku_id = s.id
      AND (wi.batch_id IS NOT NULL OR li.batch_id IS NOT NULL)
    LIMIT  1
  ) pb_sub ON true`,
];

/**
 * Base SELECT fields — always returned regardless of access level.
 * All non-id fields use MIN() to collapse any residual duplicate rows from
 * other one-to-many relationships that GROUP BY s.id deduplicates.
 */
const BASE_SELECT_FIELDS = [
  's.id',
  'MIN(s.sku)          AS sku',
  'MIN(s.barcode)      AS barcode',
  'MIN(s.country_code) AS country_code',
  'MIN(p.name)         AS product_name',
  'MIN(p.brand)        AS brand',
  'MIN(s.size_label)   AS size_label',
];

/**
 * Diagnostic SELECT fields — only included when PRIVILEGED_JOINS are active.
 *
 * wi_sub, li_sub, and pb_sub are LATERAL subqueries with LIMIT 1, so they
 * return exactly one row per SKU. PostgreSQL requires all non-aggregated SELECT
 * columns to appear in GROUP BY — even single-valued LATERAL results.
 *
 * minUuid() casts to text, applies MIN(), then casts back to uuid. This is the
 * same pattern used for p.status_id and s.status_id, and is the correct way to
 * aggregate uuid columns in PostgreSQL since MIN(uuid) does not exist.
 */
const DIAGNOSTIC_SELECT_FIELDS = [
  minUuid('p',      'status_id',           'product_status_id'),
  minUuid('s',      'status_id',           'sku_status_id'),
  minUuid('wi_sub', 'warehouse_status_id', 'warehouse_status_id'),
  minUuid('li_sub', 'location_status_id',  'location_status_id'),
  minUuid('pb_sub', 'batch_status_id',     'batch_status_id'),
];

/** Full SELECT field list for privileged queries. */
const PRIVILEGED_SELECT_FIELDS = [
  ...BASE_SELECT_FIELDS,
  ...DIAGNOSTIC_SELECT_FIELDS,
];

module.exports = {
  TABLE_NAME,
  BASE_JOINS,
  PRIVILEGED_JOINS,
  BASE_SELECT_FIELDS,
  DIAGNOSTIC_SELECT_FIELDS,
  PRIVILEGED_SELECT_FIELDS,
};
