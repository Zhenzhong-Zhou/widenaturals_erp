/**
 * @file bom-queries.js
 * @description SQL query constants and factory functions for bom-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - BOM_TABLE                   — aliased table name passed to paginateQuery
 *  - BOM_JOINS                   — join array for paginated list query
 *  - BOM_SORT_WHITELIST          — valid sort fields for paginated query
 *  - BOM_ADDITIONAL_SORTS        — deterministic tie-break sort columns
 *  - buildBomPaginatedQuery       — factory for paginated list query
 *  - BOM_DETAILS_QUERY           — full detail fetch with items and parts
 *  - BOM_PRODUCTION_SUMMARY_QUERY — CTE-based production summary by bom_id
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated List ───────────────────────────────────────────────────────────

const BOM_TABLE = 'boms b';

const BOM_JOINS = [
  'JOIN skus AS s              ON b.sku_id = s.id',
  'JOIN products AS p          ON s.product_id = p.id',
  'LEFT JOIN sku_compliance_links AS scl ON scl.sku_id = s.id',
  'LEFT JOIN compliance_records AS cr    ON cr.id = scl.compliance_record_id',
  'LEFT JOIN status AS st_bom            ON st_bom.id = b.status_id',
  'LEFT JOIN status AS st_compliance     ON st_compliance.id = cr.status_id',
  'LEFT JOIN users AS cu                 ON cu.id = b.created_by',
  'LEFT JOIN users AS uu                 ON uu.id = b.updated_by',
];

const _BOM_JOINS_SQL = BOM_JOINS.join('\n  ');

const BOM_SORT_WHITELIST = new Set(Object.values(SORTABLE_FIELDS.bomSortMap));

// Deterministic tie-breaking applied after the primary sort.
const BOM_ADDITIONAL_SORTS = [
  { column: 's.sku',        direction: 'ASC'  },
  { column: 'b.is_default', direction: 'DESC' },
  { column: 'b.is_active',  direction: 'DESC' },
  { column: 'b.revision',   direction: 'DESC' },
  { column: 'b.created_at', direction: 'DESC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildBomFilter.
 * @returns {string}
 */
const buildBomPaginatedQuery = (whereClause) => `
  SELECT
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.series,
    p.category,
    s.id                          AS sku_id,
    s.sku                         AS sku_code,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.description                 AS sku_description,
    cr.id                         AS compliance_record_id,
    cr.type                       AS compliance_type,
    cr.compliance_id              AS compliance_number,
    st_compliance.name            AS compliance_status,
    cr.issued_date                AS compliance_issued_date,
    cr.expiry_date                AS compliance_expiry_date,
    b.id                          AS bom_id,
    b.code                        AS bom_code,
    b.name                        AS bom_name,
    b.revision                    AS bom_revision,
    b.is_active,
    b.is_default,
    b.description                 AS bom_description,
    b.status_id                   AS bom_status_id,
    st_bom.name                   AS bom_status,
    b.status_date                 AS bom_status_date,
    b.created_at                  AS bom_created_at,
    b.created_by                  AS bom_created_by,
    cu.firstname                  AS bom_created_by_firstname,
    cu.lastname                   AS bom_created_by_lastname,
    b.updated_at                  AS bom_updated_at,
    b.updated_by                  AS bom_updated_by,
    uu.firstname                  AS bom_updated_by_firstname,
    uu.lastname                   AS bom_updated_by_lastname
  FROM ${BOM_TABLE}
  ${_BOM_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// Full detail projection including bom_items and parts.
// Returns multiple rows per BOM — one per item/part combination.
// $1: bom_id (UUID)
const BOM_DETAILS_QUERY = `
  SELECT
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.series,
    p.category,
    s.id                          AS sku_id,
    s.sku                         AS sku_code,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.description                 AS sku_description,
    cr.id                         AS compliance_id,
    cr.type                       AS compliance_type,
    cr.compliance_id              AS compliance_number,
    cr.issued_date                AS compliance_issued_date,
    cr.expiry_date                AS compliance_expiry_date,
    cr.description                AS compliance_description,
    cr.status_id                  AS compliance_status_id,
    st_compliance.name            AS compliance_status,
    cr.status_date                AS compliance_status_date,
    b.id                          AS bom_id,
    b.code                        AS bom_code,
    b.name                        AS bom_name,
    b.revision                    AS bom_revision,
    b.is_active                   AS bom_is_active,
    b.is_default                  AS bom_is_default,
    b.description                 AS bom_description,
    b.status_id                   AS bom_status_id,
    st_bom.name                   AS bom_status,
    b.status_date                 AS bom_status_date,
    b.created_at                  AS bom_created_at,
    b.created_by                  AS bom_created_by,
    cu.firstname                  AS bom_created_by_firstname,
    cu.lastname                   AS bom_created_by_lastname,
    b.updated_at                  AS bom_updated_at,
    b.updated_by                  AS bom_updated_by,
    uu.firstname                  AS bom_updated_by_firstname,
    uu.lastname                   AS bom_updated_by_lastname,
    bi.id                         AS bom_item_id,
    bi.part_qty_per_product,
    bi.unit,
    bi.specifications,
    bi.estimated_unit_cost,
    bi.currency,
    bi.exchange_rate,
    bi.note,
    bi.created_at                 AS bom_item_created_at,
    bi.created_by                 AS bom_item_created_by,
    ci.firstname                  AS bom_item_created_by_firstname,
    ci.lastname                   AS bom_item_created_by_lastname,
    bi.updated_at                 AS bom_item_updated_at,
    bi.updated_by                 AS bom_item_updated_by,
    ui.firstname                  AS bom_item_updated_by_firstname,
    ui.lastname                   AS bom_item_updated_by_lastname,
    pa.id                         AS part_id,
    pa.code                       AS part_code,
    pa.name                       AS part_name,
    pa.type                       AS part_type,
    pa.unit_of_measure,
    pa.description                AS part_description
  FROM boms AS b
  JOIN skus AS s                        ON s.id = b.sku_id
  JOIN products AS p                    ON p.id = s.product_id
  LEFT JOIN sku_compliance_links AS scl ON scl.sku_id = s.id
  LEFT JOIN compliance_records AS cr    ON cr.id = scl.compliance_record_id
  LEFT JOIN status AS st_compliance     ON st_compliance.id = cr.status_id
  LEFT JOIN status AS st_bom            ON st_bom.id = b.status_id
  LEFT JOIN bom_items AS bi             ON bi.bom_id = b.id
  LEFT JOIN parts AS pa                 ON pa.id = bi.part_id
  LEFT JOIN users AS cu                 ON cu.id = b.created_by
  LEFT JOIN users AS uu                 ON uu.id = b.updated_by
  LEFT JOIN users AS ci                 ON ci.id = bi.created_by
  LEFT JOIN users AS ui                 ON ui.id = bi.updated_by
  WHERE b.id = $1
  ORDER BY bi.id ASC, pa.type ASC
`;

// ─── Production Summary ───────────────────────────────────────────────────────

// CTE-based production summary — computes available inventory, shortage,
// and max producible units per BOM part requirement.
// $1: bom_id (UUID)
const BOM_PRODUCTION_SUMMARY_QUERY = `
  WITH part_requirements AS (
    SELECT
      bi.bom_id,
      pa.id                                   AS part_id,
      pa.name                                 AS part_name,
      bim.packaging_material_id,
      COALESCE(bim.material_qty_per_product, 1) AS material_qty_per_product,
      COALESCE(bim.unit, 'pcs')               AS required_unit
    FROM bom_items AS bi
    JOIN parts AS pa              ON pa.id = bi.part_id
    LEFT JOIN bom_item_materials AS bim ON bim.bom_item_id = bi.id
    WHERE bi.bom_id = $1
  ),
  part_inventory AS (
    SELECT
      pm.id                                   AS packaging_material_id,
      SUM(wi.warehouse_quantity - wi.reserved_quantity) AS total_available_quantity
    FROM warehouse_inventory wi
    JOIN batch_registry br        ON wi.batch_id = br.id
    LEFT JOIN packaging_material_batches pmb
      ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms
      ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    WHERE br.batch_type = 'packaging_material'
    GROUP BY pm.id
  ),
  part_details AS (
    SELECT
      pm.id                                   AS packaging_material_id,
      pm.name                                 AS material_name,
      pmb.id                                  AS packaging_material_batch_id,
      pmb.material_snapshot_name,
      pmb.received_label_name,
      pmb.lot_number,
      pmb.quantity                            AS batch_quantity,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      (wi.warehouse_quantity - wi.reserved_quantity) AS available_quantity,
      wi.inbound_date,
      wi.outbound_date,
      wi.last_update,
      wi.status_id                            AS warehouse_inventory_status_id,
      ist.name                                AS inventory_status,
      w.name                                  AS warehouse_name,
      pms.supplier_id,
      sup.name                                AS supplier_name,
      CASE
        WHEN (wi.warehouse_quantity - wi.reserved_quantity) > 0
        THEN TRUE ELSE FALSE
      END                                     AS is_usable_for_production,
      CASE
        WHEN COALESCE(bst.is_active, FALSE) = FALSE
        THEN TRUE ELSE FALSE
      END                                     AS is_inactive_batch
    FROM warehouse_inventory wi
    JOIN warehouses w             ON wi.warehouse_id = w.id
    JOIN batch_registry br        ON wi.batch_id = br.id
    JOIN inventory_status ist     ON wi.status_id = ist.id
      AND ist.name IN ('available', 'in_stock')
    LEFT JOIN packaging_material_batches pmb
      ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN batch_status AS bst ON bst.id = pmb.status_id
      AND bst.name IN ('active', 'inactive')
    LEFT JOIN packaging_material_suppliers pms
      ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN suppliers sup       ON sup.id = pms.supplier_id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    WHERE br.batch_type = 'packaging_material'
  )
  SELECT
    pr.part_id,
    pr.part_name,
    pr.material_qty_per_product   AS required_qty_per_unit,
    COALESCE(pi.total_available_quantity, 0) AS total_available_quantity,
    CASE
      WHEN COALESCE(pr.material_qty_per_product, 0) = 0 THEN NULL
      ELSE FLOOR(
        COALESCE(pi.total_available_quantity, 0) / pr.material_qty_per_product
      )
    END                           AS max_producible_units,
    CASE
      WHEN COALESCE(pi.total_available_quantity, 0) < pr.material_qty_per_product
      THEN TRUE ELSE FALSE
    END                           AS is_shortage,
    GREATEST(
      pr.material_qty_per_product - COALESCE(pi.total_available_quantity, 0), 0
    )                             AS shortage_qty,
    pd.material_name,
    pd.packaging_material_batch_id,
    pd.material_snapshot_name,
    pd.received_label_name,
    pd.lot_number,
    pd.batch_quantity,
    pd.warehouse_quantity,
    pd.reserved_quantity,
    pd.available_quantity,
    pd.inbound_date,
    pd.outbound_date,
    pd.last_update,
    pd.inventory_status,
    pd.warehouse_name,
    pd.supplier_name
  FROM part_requirements pr
  LEFT JOIN part_inventory pi
    ON pi.packaging_material_id = pr.packaging_material_id
  LEFT JOIN part_details pd
    ON pd.packaging_material_id = pr.packaging_material_id
  ORDER BY pr.part_name, pd.material_name, pd.lot_number, pd.warehouse_name
`;

module.exports = {
  BOM_TABLE,
  BOM_JOINS,
  BOM_SORT_WHITELIST,
  BOM_ADDITIONAL_SORTS,
  buildBomPaginatedQuery,
  BOM_DETAILS_QUERY,
  BOM_PRODUCTION_SUMMARY_QUERY,
};
