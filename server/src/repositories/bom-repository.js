/**
 * @fileoverview
 * Repository-level function for fetching paginated BOMs.
 * Handles SQL query construction, joins, filters, and safe parameterization.
 * Logs query context and metadata for observability and audit tracking.
 */

const { buildBomFilter } = require('../utils/sql/build-bom-filters');
const { paginateQuery, query } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Repository function to fetch a paginated, filterable, and sortable list of
 * Bill of Materials (BOM) records from the database, including joined
 * product, SKU, compliance, status, and audit user information.
 *
 * This function is responsible solely for query construction and database access.
 * It should not include business logic beyond filtering, sorting, and pagination.
 * Typically consumed by the service layer (e.g., `fetchPaginatedBomsService`).
 *
 * @async
 * @function
 * @param {Object} options - Query and pagination options.
 * @param {Object} [options.filters={}] - Dynamic filters for BOMs (e.g. `keyword`, `skuCode`, `isActive`, `onlyActiveCompliance`).
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy] - Column name or SQL expression to sort by (e.g. `'p.name'`, `'b.created_at'`).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction for results.
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Paginated query result with `data` array and pagination metadata.
 *
 * @example
 * const result = await getPaginatedBoms({
 *   filters: { isActive: true, keyword: 'Marine Oil', onlyActiveCompliance: true },
 *   page: 1,
 *   limit: 25,
 *   sortBy: 'p.name',
 *   sortOrder: 'ASC',
 * });
 *
 * // result.data → array of BOM rows joined with Product, SKU, Compliance, and Status info
 * // result.pagination → { page: 1, limit: 25, totalRecords: 42, totalPages: 5 }
 *
 * @throws {AppError} Throws a `databaseError` when the query or pagination fails.
 *
 * @see buildBomFilter
 * @see paginateQuery
 * @see logSystemInfo
 * @see logSystemException
 */
const getPaginatedBoms = async ({
                                  filters = {},
                                  page = 1,
                                  limit = 10,
                                  sortBy,
                                  sortOrder = 'DESC',
                                }) => {
  const { whereClause, params } = buildBomFilter(filters);
  
  const tableName = 'boms b';
  
  const joins = [
    'JOIN skus AS s ON b.sku_id = s.id',
    'JOIN products AS p ON s.product_id = p.id',
    'LEFT JOIN compliances AS c ON c.sku_id = s.id',
    'LEFT JOIN status AS st_bom ON st_bom.id = b.status_id',
    'LEFT JOIN status AS st_compliance ON st_compliance.id = c.status_id',
    'LEFT JOIN users AS cu ON cu.id = b.created_by',
    'LEFT JOIN users AS uu ON uu.id = b.updated_by',
  ];
  
  const baseQuery = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.series,
      p.category,
      s.id AS sku_id,
      s.sku AS sku_code,
      s.barcode,
      s.language,
      s.country_code,
      s.market_region,
      s.size_label,
      s.description AS sku_description,
      c.id AS compliance_id,
      c.type AS compliance_type,
      c.compliance_id AS compliance_number,
      st_compliance.name AS compliance_status,
      c.issued_date AS compliance_issued_date,
      c.expiry_date AS compliance_expiry_date,
      b.id AS bom_id,
      b.code AS bom_code,
      b.name AS bom_name,
      b.revision AS bom_revision,
      b.is_active,
      b.is_default,
      b.description AS bom_description,
      b.status_id AS bom_status_id,
      st_bom.name AS bom_status,
      b.status_date AS bom_status_date,
      b.created_at AS bom_created_at,
      b.created_by AS bom_created_by,
      cu.firstname AS bom_created_by_firstname,
      cu.lastname AS bom_created_by_lastname,
      b.updated_at AS bom_updated_at,
      b.updated_by AS bom_updated_by,
      uu.firstname AS bom_updated_by_firstname,
      uu.lastname AS bom_updated_by_lastname
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
      meta: {
        module: 'boms',
        context: 'bom-repository/getPaginatedBoms',
        filters
      },
    });
    
    logSystemInfo('Fetched paginated BOM list successfully', {
      context: 'bom-repository/getPaginatedBoms',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      totalRecords: result.pagination?.totalRecords,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated BOM list', {
      context: 'bom-repository/getPaginatedBoms',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated BOM list', {
      filters,
      pagination: { page, limit },
      error: error.message,
    });
  }
};

/**
 * Fetch full BOM details by BOM ID, including product, SKU, compliance, and BOM items.
 *
 * This query retrieves:
 *  - Product → SKU → Compliance → BOM → BOM Items → Part hierarchy
 *  - Status and user metadata for audit traceability
 *
 * Each BOM is linked to a single SKU, and optionally to one compliance record.
 * The query supports displaying all BOM items for that BOM revision.
 *
 * @async
 * @function
 * @param {string} bomId - UUID of the BOM to fetch details for.
 * @returns {Promise<Array<Object>>} Array of BOM detail rows (joined with product, SKU, compliance, items, and parts).
 * @throws {AppError} When the database query fails.
 *
 * @example
 * const rows = await getBomDetailsById('1ff78fe5-5cc0-4bf1-9460-ecbe1d4243b0');
 * console.log(rows.length); // e.g., 5 BOM item rows
 */
const getBomDetailsById = async (bomId) => {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.series,
      p.category,
      s.id AS sku_id,
      s.sku AS sku_code,
      s.barcode,
      s.language,
      s.country_code,
      s.market_region,
      s.size_label,
      s.description AS sku_description,
      c.id AS compliance_id,
      c.type AS compliance_type,
      c.compliance_id AS compliance_number,
      c.issued_date AS compliance_issued_date,
      c.expiry_date AS compliance_expiry_date,
      c.description AS compliance_description,
      c.status_id AS compliance_status_id,
      st_compliance.name AS compliance_status,
      b.id AS bom_id,
      b.code AS bom_code,
      b.name AS bom_name,
      b.revision AS bom_revision,
      b.is_active AS bom_is_active,
      b.is_default AS bom_is_default,
      b.description AS bom_description,
      b.status_id AS bom_status_id,
      st_bom.name AS bom_status,
      b.status_date AS bom_status_date,
      b.created_at AS bom_created_at,
      b.created_by AS bom_created_by,
      cu.firstname AS bom_created_by_firstname,
      cu.lastname AS bom_created_by_lastname,
      b.updated_at AS bom_updated_at,
      b.updated_by AS bom_updated_by,
      uu.firstname AS bom_updated_by_firstname,
      uu.lastname AS bom_updated_by_lastname,
      bi.id AS bom_item_id,
      bi.part_qty_per_product,
      bi.unit,
      bi.specifications,
      bi.estimated_unit_cost,
      bi.currency,
      bi.exchange_rate,
      bi.note,
      bi.created_at AS bom_item_created_at,
      bi.created_by AS bom_item_created_by,
      ci.firstname AS bom_item_created_by_firstname,
      ci.lastname AS bom_item_created_by_lastname,
      bi.updated_at AS bom_item_updated_at,
      bi.updated_by AS bom_item_updated_by,
      ui.firstname AS bom_item_updated_by_firstname,
      ui.lastname AS bom_item_updated_by_lastname,
      pa.id AS part_id,
      pa.code AS part_code,
      pa.name AS part_name,
      pa.type AS part_type,
      pa.unit_of_measure,
      pa.description AS part_description
    FROM boms AS b
    JOIN skus AS s ON s.id = b.sku_id
    JOIN products AS p ON p.id = s.product_id
    LEFT JOIN compliances AS c ON c.sku_id = s.id
    LEFT JOIN status AS st_bom ON st_bom.id = b.status_id
    LEFT JOIN status AS st_compliance ON st_compliance.id = c.status_id
    LEFT JOIN bom_items AS bi ON bi.bom_id = b.id
    LEFT JOIN parts AS pa ON pa.id = bi.part_id
    LEFT JOIN users AS cu ON cu.id = b.created_by
    LEFT JOIN users AS uu ON uu.id = b.updated_by
    LEFT JOIN users AS ci ON ci.id = bi.created_by
    LEFT JOIN users AS ui ON ui.id = bi.updated_by
    WHERE b.id = $1
    ORDER BY bi.id ASC, pa.type ASC;
  `;
  
  try {
    const result = await query(sql, [bomId]);
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch BOM details', {
      context: 'bom-repository/getBomDetailsById',
      bomId,
    });
    
    throw AppError.databaseError('Database error fetching BOM details', {
      bomId,
      hint: 'Ensure the BOM ID exists and related SKU/Product links are valid.',
    });
  }
};

/**
 * Retrieves a comprehensive production summary for a given Bill of Materials (BOM),
 * detailing all required parts, corresponding packaging material availability,
 * and batch-level warehouse inventory data.
 *
 * ---
 * **Logical stages:**
 *  1. `part_requirements` – Extracts all BOM parts and required quantities per product unit.
 *  2. `part_inventory`    – Aggregates total available quantities of packaging materials.
 *  3. `part_details`      – Expands each material into batch-level details including lot,
 *                           supplier, warehouse, and inventory status.
 * ---
 *
 * **Returned columns include:**
 *  - `part_id`, `part_name`, `required_qty_per_unit`
 *  - `total_available_quantity`, `max_producible_units`, `is_shortage`, `shortage_qty`
 *  - Detailed batch info: `lot_number`, `warehouse_name`, `supplier_name`,
 *    `available_quantity`, `inventory_status`, and timestamps.
 *
 * **Notes:**
 *  - Only includes batches with `batch_type = 'packaging_material'`.
 *  - Adds contextual flags:
 *      • `is_usable_for_production` – TRUE if available quantity > 0.
 *      • `is_inactive_batch` – TRUE if the batch status is inactive.
 *  - Designed for use in production capacity analysis, procurement planning,
 *    and manufacturing readiness audits.
 *
 * @async
 * @function
 * @param {string} bomId - UUID of the Bill of Materials to summarize.
 * @returns {Promise<Array<Object>>} A promise resolving to an array of summary rows.
 * @throws {AppError} If the database query fails or returns invalid data.
 *
 * @example
 * const summary = await getBOMProductionSummary('a1a654fb-cb9a-4fd8-9de4-e3aa4546fe84');
 * console.table(summary);
 */
const getBOMProductionSummary = async (bomId) => {
  const sql = `
    WITH part_requirements AS (
      SELECT
        bi.bom_id,
        pa.id AS part_id,
        pa.name AS part_name,
        bim.packaging_material_id,
        COALESCE(bim.material_qty_per_product, 1) AS material_qty_per_product,
        COALESCE(bim.unit, 'pcs') AS required_unit
      FROM bom_items AS bi
      JOIN parts AS pa ON pa.id = bi.part_id
      LEFT JOIN bom_item_materials AS bim ON bim.bom_item_id = bi.id
      WHERE bi.bom_id = $1
    ),
    part_inventory AS (
      SELECT
        pm.id AS packaging_material_id,
        SUM(wi.warehouse_quantity - wi.reserved_quantity) AS total_available_quantity
      FROM warehouse_inventory wi
      JOIN batch_registry br ON wi.batch_id = br.id
      LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
      LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
      LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
      WHERE br.batch_type = 'packaging_material'
      GROUP BY pm.id
    ),
    part_details AS (
      SELECT
        pm.id AS packaging_material_id,
        pm.name AS material_name,
        pmb.material_snapshot_name,
        pmb.received_label_name,
        pmb.lot_number,
        pmb.quantity AS batch_quantity,
        wi.warehouse_quantity,
        wi.reserved_quantity,
        (wi.warehouse_quantity - wi.reserved_quantity) AS available_quantity,
        wi.inbound_date,
        wi.outbound_date,
        wi.last_update,
        wi.status_id AS warehouse_inventory_status_id,
        ist.name AS inventory_status,
        w.name AS warehouse_name,
        pms.supplier_id,
        sup.name AS supplier_name,
        CASE
          WHEN (wi.warehouse_quantity - wi.reserved_quantity) > 0
          THEN TRUE ELSE FALSE
        END AS is_usable_for_production,
        CASE
          WHEN COALESCE(bst.is_active, FALSE) = FALSE
          THEN TRUE ELSE FALSE
        END AS is_inactive_batch
      FROM warehouse_inventory wi
      JOIN warehouses w ON wi.warehouse_id = w.id
      JOIN batch_registry br ON wi.batch_id = br.id
      JOIN inventory_status ist ON wi.status_id = ist.id
          AND ist.name IN ('available','in_stock')
      LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
      LEFT JOIN batch_status AS bst ON bst.id = pmb.status_id
          AND bst.name IN ('active','inactive')
      LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
      LEFT JOIN suppliers sup ON sup.id = pms.supplier_id
      LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
      WHERE br.batch_type = 'packaging_material'
    )
    SELECT
      pr.part_id,
      pr.part_name,
      pr.material_qty_per_product AS required_qty_per_unit,
      COALESCE(pi.total_available_quantity, 0) AS total_available_quantity,
      CASE
        WHEN COALESCE(pr.material_qty_per_product, 0) = 0 THEN NULL
        ELSE FLOOR(COALESCE(pi.total_available_quantity, 0) / pr.material_qty_per_product)
      END AS max_producible_units,
      CASE
        WHEN COALESCE(pi.total_available_quantity, 0) < pr.material_qty_per_product THEN TRUE
        ELSE FALSE
      END AS is_shortage,
      GREATEST(pr.material_qty_per_product - COALESCE(pi.total_available_quantity, 0), 0)
        AS shortage_qty,
      pd.material_name,
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
    ORDER BY pr.part_name, pd.material_name, pd.lot_number, pd.warehouse_name;
  `;
  
  try {
    const result = await query(sql, [bomId]);
    
    logSystemInfo(`Fetched production summary for BOM ${bomId}`, {
      context: 'bom-repository/getBOMProductionSummary',
      severity: 'info',
      recordCount: result?.rows?.length || 0,
      bomId,
    });
    
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch BOM production summary', {
      context: 'bom-repository/getBOMProductionSummary',
      severity: 'error',
      bomId,
      querySnippet: sql.slice(0, 200),
    });
    
    throw AppError.databaseError('Failed to fetch BOM production summary', {
      bomId,
    });
  }
};

module.exports = {
  getPaginatedBoms,
  getBomDetailsById,
  getBOMProductionSummary,
};
