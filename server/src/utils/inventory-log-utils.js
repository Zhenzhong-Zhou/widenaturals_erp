const AppError = require('./AppError');
const { cleanObject } = require('./object-utils');
const { generateChecksum } = require('./crypto-utils');

/**
 * Builds inventory activity log entries for both active and audit log tables.
 *
 * Responsibilities:
 * - Constructs structured log records from enriched warehouse or location inventory data.
 * - Determines inventory scope (`warehouse` or `location`) based on provided inventory ID.
 * - Calculates `previous_quantity`, `quantity_change`, and `new_quantity` values.
 * - Sets `status_effective_at` based on provided `status_date`, or defaults to current time.
 * - Builds metadata payload and generates a checksum for integrity and traceability.
 *
 * Required fields in each input record:
 * - `inventory_action_type_id`: Action performed (e.g., manual insert).
 * - `status_id`: Inventory status after the change (e.g., in_stock).
 * - `quantity` or `quantity_change`: Amount changed.
 * - `user_id`: User performing the action.
 * - Either `warehouse_inventory_id` or `location_inventory_id` must be present.
 *
 * Optional fields:
 * - `adjustment_type_id`, `order_id`, `comments`, `meta`, `metadata`
 * - `source_type`, `source_ref_id`, `previous_quantity`, `new_quantity`, `status_date`
 *
 * @param {Array<Object>} records - Enriched warehouse or location inventory records.
 * @returns {Array<Object>} Structured log objects ready for DB insertion.
 *
 * Notes:
 * - The `inventory_scope` field is set to `'warehouse'` or `'location'` for context.
 * - Metadata is merged with `{ source, record_scope }` and included in the checksum payload.
 * - Ensures accurate audit tracking by computing a stable checksum from log content.
 * - Falls back to `new Date()` if `status_date` or `inbound_date` is not available.
 *
 * @throws {AppError} If neither warehouse nor location inventory ID is provided.
 */
const buildInventoryLogRows = (records) => {
  return records.map((record) => {
    if (!record.warehouse_inventory_id && !record.location_inventory_id) {
      throw AppError.validationError(
        'Either warehouse_inventory_id or location_inventory_id must be provided'
      );
    }

    const isWarehouse = Boolean(record.warehouse_inventory_id);
    const inventoryFieldKey = isWarehouse
      ? 'warehouse_inventory_id'
      : 'location_inventory_id';
    const inventoryId = record[inventoryFieldKey] ?? record.id ?? null;
    const scope = isWarehouse ? 'warehouse' : 'location';

    const previousQty = record.previous_quantity ?? 0;
    const changeQty = record.quantity_change ?? record.quantity ?? 0;
    const newQty =
      record.new_quantity ??
      (record.quantity != null && previousQty != null
        ? previousQty + changeQty
        : (record.quantity ?? 0));

    const metadata = record.meta ?? record.metadata ?? {}; // fallback for backward compatibility

    const checksumPayload = cleanObject({
      [inventoryFieldKey]: inventoryId,
      inventory_action_type_id: record.inventory_action_type_id,
      adjustment_type_id: record.adjustment_type_id || null,
      order_id: record.order_id || null,
      quantity_change: changeQty,
      new_quantity: newQty,
      status_id: record.status_id,
      status_effective_at: record.status_date,
      performed_by: record.user_id,
      comments: record.comments,
      recorded_by: record.user_id,
      inventory_scope: scope,
      source_type: record.source_type || null,
      source_ref_id: record.source_ref_id || null,
      metadata: {
        source: record.source_type,
        record_scope: record.record_scope,
        ...metadata,
      },
    });

    return {
      [inventoryFieldKey]: inventoryId,
      inventory_action_type_id: record.inventory_action_type_id,
      adjustment_type_id: record.adjustment_type_id || null,
      order_id: record.order_id || null,
      previous_quantity: previousQty,
      quantity_change: changeQty,
      new_quantity: newQty,
      status_id: record.status_id,
      status_effective_at: record.status_date,
      performed_by: record.user_id,
      recorded_by: record.user_id,
      comments: record.comments || null,
      metadata: checksumPayload.metadata,
      source_type: record.source_type || null,
      source_ref_id: record.source_ref_id || null,
      inventory_scope: scope,
      checksum: generateChecksum(checksumPayload),
    };
  });
};

/**
 * Validates a single inventory log entry by verifying its checksum.
 *
 * @param {Object} record - Full inventory log record (typically fetched from DB).
 * @returns {boolean} - True if checksum is valid.
 * @throws {Error} - If checksum mismatch is detected.
 */
const validateInventoryLogChecksum = (record) => {
  const isWarehouse = Boolean(
    record.warehouse_inventory_id || record.inventory_scope === 'warehouse'
  );
  const inventoryFieldKey = isWarehouse
    ? 'warehouse_inventory_id'
    : 'location_inventory_id';
  const inventoryId = record[inventoryFieldKey];

  const checksumPayload = cleanObject({
    [inventoryFieldKey]: inventoryId,
    inventory_action_type_id: record.inventory_action_type_id,
    adjustment_type_id: record.adjustment_type_id || null,
    order_id: record.order_id || null,
    quantity_change: record.quantity_change,
    new_quantity: record.new_quantity,
    status_id: record.status_id,
    status_effective_at: record.status_effective_at,
    performed_by: record.user_id,
    recorded_by: record.user_id,
    inventory_scope: record.inventory_scope,
    source_type: record.source_type || null,
    source_ref_id: record.source_ref_id || null,
    metadata: record.metadata,
  });

  const generatedChecksum = generateChecksum(checksumPayload);

  if (generatedChecksum !== record.checksum) {
    throw new Error('Inventory log integrity check failed: checksum mismatch.');
  }

  return true;
};

/**
 * Enforces that only allowed filter keys are used based on the user's permission scope.
 *
 * Throws an authorization error if any disallowed filter key is found in the input.
 * Typically used in inventory or report services to restrict data access based on roles.
 *
 * @param {Object} filters - The filters object received from the client (e.g., { productIds, skuIds, ... })
 * @param {string[]} allowedKeys - An array of allowed filter keys based on user permissions
 * @throws {AppError} Throws an authorization error if any unauthorized filter is present
 */
const enforceAllowedFilters = (filters, allowedKeys) => {
  for (const key of Object.keys(filters)) {
    if (
      filters[key] !== undefined &&
      filters[key] !== null &&
      !allowedKeys.includes(key)
    ) {
      throw AppError.authorizationError(
        `Filter "${key}" is not allowed with your permission.`
      );
    }
  }
};

/**
 * Checks if the provided filters object contain at least one meaningful filter.
 *
 * A filter is considered valid if:
 * - It is not null or undefined.
 * - It is not an empty array.
 *
 * @param {Object} filters - The filters object to validate.
 * @returns {boolean} Returns true if at least one valid filter exists; otherwise, false.
 */
const hasValidFilters = (filters) =>
  Object.values(filters || {}).some(
    (value) =>
      value !== null &&
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0)
  );

module.exports = {
  buildInventoryLogRows,
  validateInventoryLogChecksum,
  enforceAllowedFilters,
  hasValidFilters,
};
