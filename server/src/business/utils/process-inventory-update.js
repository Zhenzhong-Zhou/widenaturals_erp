const AppError = require('../../utils/AppError');
const { InventorySourceTypes } = require('../../utils/constants/domain/inventory-source-types');

/**
 * Processes an inventory quantity update for either warehouse or location scope.
 *
 * Responsibilities:
 * - Validates input quantities against reserved quantities.
 * - Determines if the inventory status should change based on updated quantity.
 * - Computes quantity difference and status transition (in_stock ↔ out_of_stock).
 * - Constructs update payload for DB and structured log record for auditing.
 *
 * @param {Object} params
 * @param {'warehouse'|'location'} params.scope - The scope of the inventory being updated.
 * @param {string} params.idKey - The ID key used to identify the scope (e.g., 'warehouse_id', 'location_id').
 * @param {string} params.qtyKey - The key representing the quantity field (e.g., 'warehouse_quantity').
 * @param {Function} params.fetchFn - Function to fetch the existing inventory record from DB.
 * @param {Object} params.updatesMap - Object to accumulate normalized update values for DB update.
 * @param {Array<Object>} params.compositeKeys - List to accumulate composite key entries for batch update.
 * @param {Set<string>} params.seenKeys - Set to prevent processing duplicate scope-batch pairs.
 * @param {Object} params.update - The raw update object from the caller, must contain batch_id and quantity.
 * @param {string} params.inStockId - The status ID representing "inventory_in_stock".
 * @param {string} params.outOfStockId - The status ID representing "inventory_out_of_stock".
 *
 * @returns {Promise<Object|null>} A structured inventory log record if processed; otherwise null if skipped.
 *
 * @throws {AppError} If the inventory record does not exist or reserved quantity exceeds updated quantity.
 */
const processInventoryUpdate = async ({
                                        scope, // 'warehouse' or 'location'
                                        idKey,
                                        qtyKey,
                                        fetchFn,
                                        updatesMap,
                                        compositeKeys,
                                        seenKeys,
                                        update,
                                        inStockId,
                                        outOfStockId,
                                      }) => {
  const { batch_id, quantity, inventory_action_type_id, adjustment_type_id, comments } = update;
  const scope_id = update[idKey];
  
  if (!scope_id || !batch_id) return null;
  
  const compositeKey = `${scope_id}::${batch_id}`;
  if (seenKeys.has(compositeKey)) return null;
  seenKeys.add(compositeKey);
  
  const [record] = await fetchFn([{ [idKey]: scope_id, batch_id }], update.client);
  if (!record) {
    throw AppError.notFoundError(`No matching ${scope} inventory record for ${compositeKey}`);
  }
  
  const {
    id,
    [qtyKey]: currentQty,
    reserved_quantity: reservedQty,
    status_id: previousStatus,
  } = record;
  
  if (reservedQty > quantity) {
    throw AppError.validationError(`Reserved quantity exceeds updated ${scope} quantity for ${compositeKey}`);
  }
  
  const diffQty = quantity - currentQty;
  
  // === Status logic ===
  let newStatus = previousStatus;
  let statusChanged = false;
  let statusDate = null;
  if (previousStatus === inStockId || previousStatus === outOfStockId) {
    newStatus = quantity > 0 ? inStockId : outOfStockId;
    statusChanged = previousStatus !== newStatus;
    statusDate = statusChanged ? new Date().toISOString() : null;
  }
  
  // Build an update map and composite key
  updatesMap[`${scope_id}-${batch_id}`] = {
    [qtyKey]: quantity,
    status_id: newStatus,
    ...(statusDate && { status_date: statusDate }),
    last_update: new Date().toISOString(),
  };
  compositeKeys.push({ [idKey]: scope_id, batch_id });
  
  return {
    [`${scope}_inventory_id`]: id,
    quantity,
    previous_quantity: currentQty,
    quantity_change: diffQty,
    status_id: newStatus,
    status_date: statusDate,
    inventory_action_type_id,
    adjustment_type_id,
    comments: comments ?? null,
    source_type: InventorySourceTypes.MANUAL_UPDATE,
    source_ref_id: null,
    meta: {
      ...(update?.meta ?? {}),
      source_level: scope,
    },
  };
};

module.exports = processInventoryUpdate;
