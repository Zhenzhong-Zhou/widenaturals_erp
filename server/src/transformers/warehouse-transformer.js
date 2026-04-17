/**
 * @file warehouse-transformer.js
 * @description Pure transformation functions for the warehouse domain.
 *
 * Maps raw DB rows from warehouse-repository.js into UI-facing record shapes.
 * No logging, no AppError, no side effects.
 *
 * Exports:
 *  - transformWarehouseRow             — single paginated list row → WarehouseRecord
 *  - transformPaginatedWarehouseResult — paginated result set → transformed page
 *  - transformWarehouseDetail          — single detail row → WarehouseDetailRecord
 *  - transformWarehouseLookupRows      — lookup rows array → { items, hasMore }
 */

'use strict';

const { cleanObject }             = require('../utils/object-utils');
const { makeAudit, compactAudit } = require('../utils/audit-utils');
const { transformPageResult }     = require('../utils/transformer-utils');

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/**
 * Parses LATERAL aggregate fields from string to integer.
 * COUNT/SUM/COALESCE return as strings over the pg wire protocol.
 *
 * @param {WarehouseRow | WarehouseDetailRow} row
 * @returns {{ totalBatches: number, totalQuantity: number, totalReserved: number, availableQuantity: number }}
 */
const _parseSummary = (row) => {
  const totalBatches    = parseInt(row.total_batches,    10) || 0;
  const totalQuantity   = parseInt(row.total_quantity,   10) || 0;
  const totalReserved   = parseInt(row.total_reserved,   10) || 0;
  const availableQuantity = totalQuantity - totalReserved;
  
  return { totalBatches, totalQuantity, totalReserved, availableQuantity };
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Transforms a single raw warehouse row into the paginated list record shape.
 *
 * @param {WarehouseRow} row
 * @returns {WarehouseRecord}
 */
const transformWarehouseRow = (row) =>
  cleanObject({
    id:              row.id,
    name:            row.warehouse_name,
    code:            row.warehouse_code,
    storageCapacity: row.storage_capacity ?? null,
    defaultFee:      row.default_fee      ?? null,
    isArchived:      row.is_archived,
    
    location: {
      id:   row.location_id,
      name: row.location_name,
    },
    
    warehouseType: row.warehouse_type_id
      ? { id: row.warehouse_type_id, name: row.warehouse_type_name }
      : null,
    
    status: {
      id:   row.status_id,
      name: row.status_name   ?? null,
      date: row.status_date   ?? null,
    },
    
    summary: _parseSummary(row),
    
    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated warehouse result set into the UI-facing page shape.
 *
 * @param {object}         paginatedResult
 * @param {WarehouseRow[]} paginatedResult.data
 * @param {object}         paginatedResult.pagination
 * @returns {Promise<PaginatedResult<WarehouseRow>>}
 */
const transformPaginatedWarehouseResult = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<WarehouseRow>>} */
  (transformPageResult(paginatedResult, transformWarehouseRow));

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Transforms a single raw warehouse detail row into the full detail record shape.
 *
 * Returns null if the row is falsy.
 *
 * @param {WarehouseDetailRow | null} row
 * @returns {WarehouseDetailRecord | null}
 */
const transformWarehouseDetail = (row) => {
  if (!row) return null;
  
  return cleanObject({
    id:              row.id,
    name:            row.warehouse_name,
    code:            row.warehouse_code,
    storageCapacity: row.storage_capacity ?? null,
    defaultFee:      row.default_fee      ?? null,
    isArchived:      row.is_archived,
    notes:           row.notes            ?? null,
    
    location: cleanObject({
      id:              row.location_id,
      name:            row.location_name,
      addressLine1:    row.address_line1      ?? null,
      addressLine2:    row.address_line2      ?? null,
      city:            row.city               ?? null,
      provinceOrState: row.province_or_state  ?? null,
      postalCode:      row.postal_code        ?? null,
      country:         row.country            ?? null,
      locationType:    row.location_type_id
        ? { id: row.location_type_id, name: row.location_type_name }
        : null,
    }),
    
    warehouseType: row.warehouse_type_id
      ? { id: row.warehouse_type_id, name: row.warehouse_type_name }
      : null,
    
    status: {
      id:   row.status_id,
      name: row.status_name  ?? null,
      date: row.status_date  ?? null,
    },
    
    summary: _parseSummary(row),
    
    audit: compactAudit(makeAudit(row)),
  });
};

module.exports = {
  transformWarehouseRow,
  transformPaginatedWarehouseResult,
  transformWarehouseDetail,
};
