/**
 * @file warehouse-movement-transformer.js
 * @description
 * Row-to-record transformers for warehouse movement queries.
 *
 * Pure functions — no logging, no errors, no side effects.
 *
 * Exports:
 *  - transformWarehouseMovements — transform raw movement rows for API consumption
 */

'use strict';

const { getFullName } = require('../utils/person-utils');

/**
 * Transforms raw warehouse movement DB rows into structured API records.
 *
 * @param {WarehouseMovementRow[]} rows
 * @returns {object[]}
 */
const transformWarehouseMovements = (rows) =>
  (rows ?? []).map((row) => ({
    id: row.id,
    movementType: row.movement_type,
    fromZoneCode: row.from_zone_code,
    toZoneCode: row.to_zone_code,
    quantity: row.quantity,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    notes: row.notes,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
    performedByName: getFullName(
      row.performed_by_firstname,
      row.performed_by_lastname
    ),
  }));

module.exports = {
  transformWarehouseMovements,
};
