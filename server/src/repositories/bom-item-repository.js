const { query } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Repository: Fetch detailed material and supplier information for a specific BOM.
 *
 * This query returns an enriched dataset joining:
 * - BOM items and parts
 * - BOM ↔ material mappings
 * - Packaging materials and their suppliers
 * - Supplier contracts and cost details
 * - Packaging material batches (inventory lots)
 * - Full audit trail (created/updated users)
 *
 * Designed for the BOM Material Supply tab in the ERP.
 *
 * @async
 * @function
 * @param {string} bomId - The BOM ID to fetch material supply details for.
 * @returns {Promise<Array>} - Array of enriched material-supply rows.
 * @throws {AppError} - Throws a database error if the query fails.
 */
const getBomMaterialSupplyDetailsById = async (bomId) => {
  const sql = `
    SELECT
      bi.bom_id,
      bi.id AS bom_item_id,
      pa.id AS part_id,
      pa.name AS part_name,
      bim.id AS bom_item_material_id,
      bim.part_material_id,
      bim.packaging_material_id,
      bim.material_qty_per_product AS bom_required_qty,
      bim.unit AS bom_item_material_unit,
      bim.note AS bom_item_material_note,
      bim.status_id AS bom_item_material_status_id,
      st_bim.name AS bom_item_material_status,
      bim.status_date AS bom_item_material_status_date,
      bim.created_at AS bom_item_material_created_at,
      bim.created_by AS bom_item_material_created_by,
      u_bim_created.firstname AS bom_item_material_created_firstname,
      u_bim_created.lastname AS bom_item_material_created_lastname,
      bim.updated_at AS bom_item_material_updated_at,
      bim.updated_by AS bom_item_material_updated_by,
      u_bim_updated.firstname AS bom_item_material_updated_firstname,
      u_bim_updated.lastname AS bom_item_material_updated_lastname,
      pm.id AS packaging_material_id,
      pm.name AS packaging_material_name,
      pm.code AS packaging_material_code,
      pm.color AS packaging_material_color,
      pm.size AS packaging_material_size,
      pm.grade AS packaging_material_grade,
      pm.material_composition AS packaging_material_composition,
      pm.unit AS packaging_material_unit,
      pm.category AS packaging_material_category,
      pm.is_visible_for_sales_order,
      pm.estimated_unit_cost AS packaging_material_estimated_cost,
      pm.currency AS packaging_material_currency,
      pm.exchange_rate AS packaging_material_exchange_rate,
      pm.length_cm,
      pm.width_cm,
      pm.height_cm,
      pm.weight_g,
      pm.length_inch,
      pm.width_inch,
      pm.height_inch,
      pm.weight_lb,
      pm.status_id AS packaging_material_status_id,
      st_pm.name AS packaging_material_status,
      pm.status_date AS packaging_material_status_date,
      pm.is_archived,
      pm.created_at AS packaging_material_created_at,
      pm.created_by AS packaging_material_created_by,
      u_pm_created.firstname AS packaging_material_created_firstname,
      u_pm_created.lastname AS packaging_material_created_lastname,
      pm.updated_at AS packaging_material_updated_at,
      pm.updated_by AS packaging_material_updated_by,
      u_pm_updated.firstname AS packaging_material_updated_firstname,
      u_pm_updated.lastname AS packaging_material_updated_lastname,
      pms.id AS packaging_material_supplier_id,
      sup.id AS supplier_id,
      sup.name AS supplier_name,
      pms.contract_unit_cost AS supplier_contract_cost,
      pms.currency AS supplier_currency,
      pms.exchange_rate AS supplier_exchange_rate,
      pms.valid_from,
      pms.valid_to,
      pms.is_preferred,
      pms.lead_time_days,
      pms.note AS supplier_note,
      pms.created_at AS supplier_link_created_at,
      pms.created_by AS supplier_link_created_by,
      u_pms_created.firstname AS supplier_link_created_firstname,
      u_pms_created.lastname AS supplier_link_created_lastname,
      pms.updated_at AS supplier_link_updated_at,
      pms.updated_by AS supplier_link_updated_by,
      u_pms_updated.firstname AS supplier_link_updated_firstname,
      u_pms_updated.lastname AS supplier_link_updated_lastname,
      pmb.id AS packaging_material_batch_id,
      pmb.lot_number,
      pmb.material_snapshot_name,
      pmb.received_label_name,
      pmb.manufacture_date,
      pmb.expiry_date,
      pmb.quantity AS batch_quantity,
      pmb.unit AS batch_unit,
      pmb.unit_cost AS batch_unit_cost,
      pmb.currency AS batch_currency,
      pmb.exchange_rate AS batch_exchange_rate,
      pmb.total_cost AS batch_total_cost,
      pmb.status_id AS batch_status_id,
      bst.name AS batch_status,
      pmb.status_date AS batch_status_date,
      pmb.received_at,
      pmb.received_by,
      pmb.created_at AS batch_created_at,
      pmb.created_by AS batch_created_by,
      u_pmb_created.firstname AS batch_created_firstname,
      u_pmb_created.lastname AS batch_created_lastname,
      pmb.updated_at AS batch_updated_at,
      pmb.updated_by AS batch_updated_by,
      u_pmb_updated.firstname AS batch_updated_firstname,
      u_pmb_updated.lastname AS batch_updated_lastname
    FROM bom_items AS bi
    JOIN parts AS pa
      ON pa.id = bi.part_id
    LEFT JOIN bom_item_materials AS bim
      ON bim.bom_item_id = bi.id
    LEFT JOIN status AS st_bim
      ON st_bim.id = bim.status_id
    LEFT JOIN users AS u_bim_created
      ON u_bim_created.id = bim.created_by
    LEFT JOIN users AS u_bim_updated
      ON u_bim_updated.id = bim.updated_by
    LEFT JOIN packaging_materials AS pm
      ON pm.id = bim.packaging_material_id
    LEFT JOIN status AS st_pm
      ON st_pm.id = pm.status_id
    LEFT JOIN users AS u_pm_created
      ON u_pm_created.id = pm.created_by
    LEFT JOIN users AS u_pm_updated
      ON u_pm_updated.id = pm.updated_by
    LEFT JOIN packaging_material_suppliers AS pms
      ON pms.packaging_material_id = pm.id
    LEFT JOIN suppliers AS sup
      ON sup.id = pms.supplier_id
    LEFT JOIN users AS u_pms_created
      ON u_pms_created.id = pms.created_by
    LEFT JOIN users AS u_pms_updated
      ON u_pms_updated.id = pms.updated_by
    LEFT JOIN packaging_material_batches AS pmb
      ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN batch_status AS bst
      ON bst.id = pmb.status_id
    LEFT JOIN users AS u_pmb_created
      ON u_pmb_created.id = pmb.created_by
    LEFT JOIN users AS u_pmb_updated
      ON u_pmb_updated.id = pmb.updated_by
    WHERE bi.bom_id = $1
    ORDER BY pa.name, sup.name, pmb.lot_number;
  `;

  try {
    const result = await query(sql, [bomId]);
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch BOM material supply details', {
      context: 'bom-item-repository/getBomMaterialSupplyDetailsById',
      severity: 'error',
      bomId,
    });

    throw AppError.databaseError(
      'Failed to fetch BOM material supply details',
      {
        bomId,
        hint: 'Check BOM relations with bom_item_materials or supplier linkage integrity.',
      }
    );
  }
};

module.exports = {
  getBomMaterialSupplyDetailsById,
};
