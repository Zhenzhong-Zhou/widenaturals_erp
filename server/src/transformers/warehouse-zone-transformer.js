/**
 * @file warehouse-zone-transformer.js
 * @description
 * Row-to-record transformers for warehouse zone queries.
 *
 * Pure functions — no logging, no errors, no side effects.
 *
 * Exports:
 *  - transformWarehouseZones — transform raw zone rows for API consumption
 */

'use strict';

/**
 * Transforms raw warehouse zone DB rows into structured API records.
 *
 * @param {WarehouseZoneRow[]} rows
 * @returns {object[]}
 */
const transformWarehouseZones = (rows) =>
  rows.map((row) => ({
    id: row.id,
    zoneCode: row.zone_code,
    quantity: row.quantity,
    reservedQuantity: row.reserved_quantity,
    availableQuantity: row.available_quantity,
    zoneEntryDate: row.zone_entry_date,
    zoneExitDate: row.zone_exit_date,
  }));

module.exports = {
  transformWarehouseZones,
};
