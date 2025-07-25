/**
 * @fileoverview build-sku-filter.js
 * Utility to dynamically construct SQL WHERE clauses and parameter arrays for filtering SKUs and products.
 * Used in repository layers to support paginated list views or dropdowns with flexible filtering and optional stock checks.
 */

const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a dynamic SQL WHERE clause and parameters array for filtering SKU and product records.
 *
 * Enforces `productStatusId` by default (unless `allowAllSkus` is true), ensuring only active items are included.
 * Supports standard filters like brand, category, region, size label, and keyword.
 * Optionally applies inventory availability constraints based on warehouse or location inventory.
 *
 * @param {string} productStatusId - UUID of the 'active' product status to apply (unless `allowAllSkus` is true).
 * @param {Object} [filters={}] - Filtering options.
 * @param {string} [filters.brand] - Filter by product brand.
 * @param {string} [filters.category] - Filter by product category.
 * @param {string} [filters.marketRegion] - Filter by SKU market region.
 * @param {string} [filters.sizeLabel] - Filter by SKU size label.
 * @param {string} [filters.keyword] - Keyword to search against SKU, barcode, product name, and size.
 * @param {Function} keywordHandler - Function that returns SQL condition and values for keyword search.
 * @param {Object} [options={}] - Advanced filtering options.
 * @param {boolean} [options.requireAvailableStock=false] - If true, adds stock availability constraints.
 * @param {string} [options.requireAvailableStockFrom='warehouse'] - One of: 'warehouse', 'location', or 'both'.
 * @param {string} [options.batchStatusId] - Batch status UUID to constrain batch-based inventory joins.
 * @param {string} [options.inventoryStatusId] - Inventory status UUID to constrain inventory joins.
 * @param {string} [options.warehouseId] - Optional warehouse UUID filter for warehouse inventory check.
 * @param {string} [options.locationId] - Optional location UUID filter for location inventory check.
 * @param {boolean} [options.allowAllSkus=false] - If true, skips enforcing `productStatusId` and stock constraints.
 *
 * @returns {{ whereClause: string, params: Array<any> }} An SQL-safe WHERE clause string and corresponding parameter values.
 */
const buildWhereClauseAndParams = (
  productStatusId,
  filters = {},
  keywordHandler,
  options = {}
) => {
  try {
    const stockSource = options.requireAvailableStockFrom ?? 'warehouse';
    const fieldMap = SORTABLE_FIELDS.skuProductCards;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (!options.allowAllSkus) {
      if (!productStatusId) {
        throw AppError.validationError('productStatusId is required when allowAllSkus is false');
      }
      
      // Enforce active status filtering when not bypassing
      conditions.push(`p.status_id = $${paramIndex}`);
      conditions.push(`s.status_id = $${paramIndex}`);
      params.push(productStatusId);
      paramIndex++;
    }
    
    // Basic filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const field = fieldMap[key];
        if (!field && key !== 'keyword') continue;
        
        if (key === 'keyword') {
          if (typeof keywordHandler === 'function') {
            const { condition, values } = keywordHandler(value, paramIndex);
            if (condition) {
              conditions.push(condition);
              params.push(...values);
              paramIndex += values.length;
            }
          } else {
            conditions.push(`${field} ILIKE $${paramIndex}`);
            params.push(`%${value}%`);
            paramIndex++;
          }
        } else {
          conditions.push(`${field} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    }
    
    // Conditional EXISTS clauses for stock availability
    const existsClauses = [];
    
    if (options.requireAvailableStock && !options.allowAllSkus && (stockSource === 'warehouse' || stockSource === 'both')) {
      const warehouseAlias = 'wi';
      const batchAlias = 'br';
      const productBatchAlias = 'pb';
      
      let clause = `
        EXISTS (
          SELECT 1
          FROM warehouse_inventory ${warehouseAlias}
          JOIN batch_registry ${batchAlias} ON ${batchAlias}.id = ${warehouseAlias}.batch_id
          JOIN product_batches ${productBatchAlias} ON ${batchAlias}.product_batch_id = ${productBatchAlias}.id
          WHERE ${productBatchAlias}.sku_id = s.id
            AND ${warehouseAlias}.warehouse_quantity > 0
      `;
      
      if (options.batchStatusId) {
        clause += ` AND ${productBatchAlias}.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }
      
      if (options.inventoryStatusId) {
        clause += ` AND ${warehouseAlias}.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }
      
      if (options.warehouseId) {
        clause += ` AND ${warehouseAlias}.warehouse_id = $${paramIndex++}`;
        params.push(options.warehouseId);
      }
      
      clause += `)`;
      existsClauses.push(clause);
    }
    
    if (options.requireAvailableStock && !options.allowAllSkus && (stockSource === 'location' || stockSource === 'both')) {
      const locInvAlias = 'li';
      const batchAlias = 'br2';
      const productBatchAlias = 'pb2';
      
      let clause = `
        EXISTS (
          SELECT 1
          FROM location_inventory ${locInvAlias}
          JOIN batch_registry ${batchAlias} ON ${batchAlias}.id = ${locInvAlias}.batch_id
          JOIN product_batches ${productBatchAlias} ON ${batchAlias}.product_batch_id = ${productBatchAlias}.id
          WHERE ${productBatchAlias}.sku_id = s.id
            AND ${locInvAlias}.location_quantity > 0
      `;
      
      if (options.batchStatusId) {
        clause += ` AND ${productBatchAlias}.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }
      
      if (options.inventoryStatusId) {
        clause += ` AND ${locInvAlias}.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }
      
      if (options.locationId) {
        clause += ` AND ${locInvAlias}.location_id = $${paramIndex++}`;
        params.push(options.locationId);
      }
      
      clause += `)`;
      existsClauses.push(clause);
    }
    
    if (existsClauses.length > 0) {
      conditions.push(`(${existsClauses.join(' OR ')})`);
    }
    
    // If no condition and allowAllSkus is true, fallback to `1=1`
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    
    return { whereClause, params };
  } catch (err) {
    logSystemException(err, 'Failed to construct WHERE clause', {
      context: 'sku-repository/buildWhereClauseAndParams',
      error: err.message,
      filters,
      productStatusId,
    });
    throw AppError.transformerError('Failed to prepare filter conditions', {
      details: err.message,
      stage: 'build-where-clause',
    });
  }
};

/**
 * Default keyword handler for SKU/product filtering.
 *
 * Constructs a condition that performs case-insensitive partial matches
 * against SKU, barcode, product name, and SKU size label.
 *
 * @param {string} keyword - The keyword value to search for.
 * @param {number} paramIndex - The current positional parameter index (for SQL parameter binding).
 * @returns {{ condition: string, values: string[] }} SQL WHERE condition and the corresponding parameter array.
 */
const skuDropdownKeywordHandler = (keyword, paramIndex) => {
  const trimmed = keyword.trim().toLowerCase();
  const param = `%${trimmed}%`;
  
  const condition = `(
    LOWER(s.sku) LIKE $${paramIndex} OR
    LOWER(s.barcode) LIKE $${paramIndex} OR
    LOWER(p.name) LIKE $${paramIndex} OR
    LOWER(s.size_label) LIKE $${paramIndex}
  )`;
  
  return {
    condition,
    values: [param],
  };
};

module.exports = {
  buildWhereClauseAndParams,
  skuDropdownKeywordHandler,
};
