/**
 * @file bom-item-repository.js
 * @description Database access layer for BOM item records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from bom-item-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getBomMaterialSupplyDetailsById — full supply chain detail by bom_id
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { BOM_ITEM_MATERIAL_SUPPLY_DETAILS } = require('./queries/bom-item-queries');

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full BOM material supply chain details for a given BOM ID.
 *
 * Joins bom_items through parts, bom_item_materials, packaging materials,
 * supplier links, and packaging material batches — including full audit
 * user fields for each joined entity.
 *
 * Returns all matching rows ordered by part name, supplier name, and lot number.
 * Returns an empty array if no rows match.
 *
 * @param {string} bomId - UUID of the BOM to fetch supply details for.
 *
 * @returns {Promise<Array<Object>>} Supply chain detail rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getBomMaterialSupplyDetailsById = async (bomId) => {
  const context = 'bom-item-repository/getBomMaterialSupplyDetailsById';
  
  try {
    const result = await query(BOM_ITEM_MATERIAL_SUPPLY_DETAILS, [bomId]);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch BOM material supply details.',
      meta:    { bomId },
      logFn:   (err) => logDbQueryError(
        BOM_ITEM_MATERIAL_SUPPLY_DETAILS,
        [bomId],
        err,
        { context, bomId }
      ),
    });
  }
};

module.exports = {
  getBomMaterialSupplyDetailsById,
};
