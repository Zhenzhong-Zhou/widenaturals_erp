/**
 * @file sku-queries.js
 * @description SQL query constants and factory functions for sku-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - GET_LAST_SKU_QUERY                — fetch most recent SKU matching a brand/category pattern
 *  - CHECK_BARCODE_EXISTS_QUERY        — existence check for a barcode value
 *  - CHECK_SKU_EXISTS_QUERY            — existence check for a sku + product_id pair
 *  - SKU_DETAILS_QUERY                 — full SKU metadata fetch by id
 *  - SKU_HAS_ANY_HISTORY_QUERY         — existence check across orders, batches, and inventory
 *  - PRIVILEGED_JOINS                  — join set for allowAllSkus dropdown queries
 *  - BASE_JOINS                        — join set for standard dropdown queries
 *  - PRIVILEGED_SELECT_FIELDS          — select fields for allowAllSkus dropdown queries
 *  - BASE_SELECT_FIELDS                — select fields for standard dropdown queries
 *  - TABLE_NAME                        — aliased table name passed to paginateQueryByOffset
 *  - SKU_PRODUCT_CARD_JOINS            — join array for product card paginated query
 *  - SKU_PRODUCT_CARD_SORT_WHITELIST   — valid sort fields for product card query
 *  - buildSkuProductCardQuery          — factory for paginated product card query
 *  - SKU_LIST_JOINS                    — join array for paginated SKU list query
 *  - SKU_LIST_SORT_WHITELIST           — valid sort fields for paginated SKU list query
 *  - SKU_LIST_ADDITIONAL_SORTS         — deterministic tie-break sort columns
 *  - buildPaginatedSkusQuery           — factory for paginated SKU list query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');
const { minUuid } = require('../../utils/sql/sql-helpers');

// ─── Scalar Lookups ───────────────────────────────────────────────────────────

// $1: pattern — e.g. 'CH-HN%'
const GET_LAST_SKU_QUERY = `
  SELECT sku
  FROM skus
  WHERE sku LIKE $1
  ORDER BY sku DESC
  LIMIT 1
`;

// $1: barcode
const CHECK_BARCODE_EXISTS_QUERY = `
  SELECT 1
  FROM skus
  WHERE barcode = $1
  LIMIT 1
`;

// $1: sku, $2: product_id
const CHECK_SKU_EXISTS_QUERY = `
  SELECT 1
  FROM skus
  WHERE sku = $1 AND product_id = $2
  LIMIT 1
`;

// ─── SKU Detail ───────────────────────────────────────────────────────────────

// $1: sku id (UUID)
const SKU_DETAILS_QUERY = `
  SELECT
    s.id                        AS sku_id,
    s.product_id,
    p.name                      AS product_name,
    p.series                    AS product_series,
    p.brand                     AS product_brand,
    p.category                  AS product_category,
    s.sku,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.description               AS sku_description,
    s.length_cm,
    s.width_cm,
    s.height_cm,
    s.weight_g,
    s.length_inch,
    s.width_inch,
    s.height_inch,
    s.weight_lb,
    s.status_id                 AS sku_status_id,
    st.name                     AS sku_status_name,
    s.status_date               AS sku_status_date,
    s.created_at,
    s.updated_at,
    s.created_by,
    s.updated_by,
    u1.firstname                AS created_by_firstname,
    u1.lastname                 AS created_by_lastname,
    u2.firstname                AS updated_by_firstname,
    u2.lastname                 AS updated_by_lastname
  FROM skus s
  LEFT JOIN products p  ON p.id = s.product_id
  LEFT JOIN status st   ON st.id = s.status_id
  LEFT JOIN users u1    ON u1.id = s.created_by
  LEFT JOIN users u2    ON u2.id = s.updated_by
  WHERE s.id = $1
`;

// ─── SKU History Check ────────────────────────────────────────────────────────

// $1: sku_id (UUID)
const SKU_HAS_ANY_HISTORY_QUERY = `
  SELECT 1
  WHERE EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.sku_id = $1
  )
  OR EXISTS (
    SELECT 1
    FROM product_batches pb
    WHERE pb.sku_id = $1
  )
  OR EXISTS (
    SELECT 1
    FROM warehouse_inventory wi
    JOIN batch_registry br
      ON wi.batch_id = br.id
    JOIN product_batches pb
      ON br.product_batch_id = pb.id
    WHERE pb.sku_id = $1
  )
`;

// ─── SKU Dropdown (Lookup) ────────────────────────────────────────────────────

const TABLE_NAME = 'skus s';

const BASE_JOINS = [
  'LEFT JOIN products p ON s.product_id = p.id',
];

const PRIVILEGED_JOINS = [
  ...BASE_JOINS,
  'LEFT JOIN status sku_status     ON sku_status.id     = s.status_id',
  'LEFT JOIN status product_status ON product_status.id = p.status_id',
  `LEFT JOIN LATERAL (
    SELECT wi.status_id AS warehouse_status_id
    FROM   product_batches pb
    JOIN   batch_registry br         ON br.product_batch_id = pb.id
    JOIN   warehouse_inventory wi    ON wi.batch_id         = br.id
    WHERE  pb.sku_id = s.id
    LIMIT  1
  ) wi_sub ON true`,
  `LEFT JOIN LATERAL (
    SELECT li.status_id AS location_status_id
    FROM   product_batches pb
    JOIN   batch_registry br         ON br.product_batch_id = pb.id
    JOIN   location_inventory li     ON li.batch_id         = br.id
    WHERE  pb.sku_id = s.id
    LIMIT  1
  ) li_sub ON true`,
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

const BASE_SELECT_FIELDS = [
  's.id',
  'MIN(s.sku)          AS sku',
  'MIN(s.barcode)      AS barcode',
  'MIN(s.country_code) AS country_code',
  'MIN(p.name)         AS product_name',
  'MIN(p.brand)        AS brand',
  'MIN(s.size_label)   AS size_label',
];

const PRIVILEGED_SELECT_FIELDS = [
  ...BASE_SELECT_FIELDS,
  minUuid('p',      'status_id',           'product_status_id'),
  minUuid('s',      'status_id',           'sku_status_id'),
  minUuid('wi_sub', 'warehouse_status_id', 'warehouse_status_id'),
  minUuid('li_sub', 'location_status_id',  'location_status_id'),
  minUuid('pb_sub', 'batch_status_id',     'batch_status_id'),
];

// ─── SKU Product Cards ────────────────────────────────────────────────────────

const SKU_PRODUCT_CARD_JOINS = [
  'INNER JOIN products p                   ON s.product_id = p.id',
  'INNER JOIN status st                    ON p.status_id = st.id',
  'LEFT JOIN status sku_status             ON s.status_id = sku_status.id',
  'LEFT JOIN sku_compliance_links scl      ON scl.sku_id = s.id',
  'LEFT JOIN compliance_records cr         ON cr.id = scl.compliance_record_id',
  `LEFT JOIN LATERAL (
    SELECT pr.price, pr.status_id
    FROM pricing pr
    INNER JOIN pricing_types pt
      ON pr.price_type_id = pt.id
     AND pt.name = 'MSRP'
    INNER JOIN locations l
      ON pr.location_id = l.id
    INNER JOIN location_types lt
      ON l.location_type_id = lt.id
     AND lt.name = 'Office'
    WHERE pr.sku_id = s.id
    ORDER BY pr.valid_from DESC NULLS LAST
    LIMIT 1
  ) pr ON TRUE`,
  'LEFT JOIN status ps                     ON pr.status_id = ps.id',
  `LEFT JOIN LATERAL (
    SELECT si.image_url, si.alt_text
    FROM sku_images si
    WHERE si.sku_id = s.id
      AND si.image_type = 'thumbnail'
    ORDER BY
      MAX(
        CASE
          WHEN si.image_type = 'main'
          THEN si.is_primary::int
          ELSE 0
        END
      ) OVER (PARTITION BY si.group_id) DESC,
      si.display_order ASC
    LIMIT 1
  ) img ON TRUE`,
];

const _SKU_PRODUCT_CARD_JOINS_SQL = SKU_PRODUCT_CARD_JOINS.join('\n  ');

const SKU_PRODUCT_CARD_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.skuProductCards)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildSkuProductCardFilters.
 * @returns {string}
 */
const buildSkuProductCardQuery = (whereClause) => `
  SELECT
    p.name                        AS product_name,
    p.series,
    p.brand,
    p.category,
    st.name                       AS product_status_name,
    s.id                          AS sku_id,
    s.sku                         AS sku_code,
    s.barcode,
    s.country_code,
    s.market_region,
    s.size_label,
    sku_status.name               AS sku_status_name,
    cr.type                       AS compliance_type,
    cr.compliance_id              AS compliance_id,
    pr.price                      AS msrp_price,
    img.image_url                 AS primary_image_url,
    img.alt_text                  AS image_alt_text
  FROM skus s
  ${_SKU_PRODUCT_CARD_JOINS_SQL}
  WHERE ${whereClause}
  GROUP BY
    p.id,
    st.name,
    s.id,
    s.sku,
    s.barcode,
    s.market_region,
    s.size_label,
    sku_status.name,
    cr.compliance_id,
    cr.type,
    pr.price,
    img.image_url,
    img.alt_text
`;

// ─── Paginated SKU List ───────────────────────────────────────────────────────

const SKU_LIST_JOINS = [
  'LEFT JOIN products p          ON p.id = s.product_id',
  'LEFT JOIN status st           ON st.id = s.status_id',
  'LEFT JOIN users u1            ON s.created_by = u1.id',
  'LEFT JOIN users u2            ON s.updated_by = u2.id',
  `LEFT JOIN LATERAL (
    SELECT t.image_url
    FROM (
      SELECT
        si.*,
        MAX(
          CASE
            WHEN si.image_type = 'main'
            THEN si.is_primary::int
            ELSE 0
          END
        ) OVER (PARTITION BY si.group_id) AS group_primary
      FROM sku_images si
      WHERE si.sku_id = s.id
    ) t
    WHERE t.image_type = 'thumbnail'
    ORDER BY
      t.group_primary DESC,
      t.display_order ASC
    LIMIT 1
  ) img ON TRUE`,
];

const _SKU_LIST_JOINS_SQL = SKU_LIST_JOINS.join('\n  ');

const SKU_LIST_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.skuSortMap)
);

// Deterministic tie-breaking applied after the primary sort.
const SKU_LIST_ADDITIONAL_SORTS = [
  { column: 'p.name',       direction: 'ASC'  },
  { column: 's.sku',        direction: 'ASC'  },
  { column: 's.created_at', direction: 'DESC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildSkuFilter.
 * @returns {string}
 */
const buildPaginatedSkusQuery = (whereClause) => `
  SELECT
    s.id                          AS sku_id,
    s.product_id,
    p.name                        AS product_name,
    p.series,
    p.brand,
    p.category,
    s.sku,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.status_id,
    st.name                       AS status_name,
    s.status_date,
    s.created_at,
    s.updated_at,
    s.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    s.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname,
    img.image_url                 AS primary_image_url
  FROM skus s
  ${_SKU_LIST_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  GET_LAST_SKU_QUERY,
  CHECK_BARCODE_EXISTS_QUERY,
  CHECK_SKU_EXISTS_QUERY,
  SKU_DETAILS_QUERY,
  SKU_HAS_ANY_HISTORY_QUERY,
  TABLE_NAME,
  PRIVILEGED_JOINS,
  BASE_JOINS,
  PRIVILEGED_SELECT_FIELDS,
  BASE_SELECT_FIELDS,
  SKU_PRODUCT_CARD_JOINS,
  SKU_PRODUCT_CARD_SORT_WHITELIST,
  buildSkuProductCardQuery,
  SKU_LIST_JOINS,
  SKU_LIST_SORT_WHITELIST,
  SKU_LIST_ADDITIONAL_SORTS,
  buildPaginatedSkusQuery,
};
