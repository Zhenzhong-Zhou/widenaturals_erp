const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const {
  transformPaginatedResult,
  transformRows,
} = require('../utils/transformer-utils');
const { getFullName } = require('../utils/name-utils');
const { formatAddress } = require('../utils/string-utils');

/**
 * Transforms an array of raw batch registry rows into lookup-friendly shapes.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Array of transformed lookup objects.
 */
const transformBatchRegistryLookupItem = (row) => {
  return cleanObject({
    id: row.batch_registry_id,
    type: row.batch_type,
    product: row.product_batch_id
      ? {
          id: row.product_batch_id,
          name: getProductDisplayName(row),
          lotNumber: row.product_lot_number,
          expiryDate: row.product_expiry_date,
        }
      : null,
    packagingMaterial: row.packaging_material_batch_id
      ? {
          id: row.packaging_material_batch_id,
          lotNumber: row.material_lot_number,
          expiryDate: row.material_expiry_date,
          snapshotName: row.material_snapshot_name,
          receivedLabel: row.received_label_name,
        }
      : null,
  });
};

/**
 * Transforms a paginated result of batch registry records for lookup usage,
 * applying a row-level transformer and formatting the response for load-more support.
 *
 * @param {Object} paginatedResult - The raw paginated query result.
 * @returns {Object} Transformed response including items, limit, offset, and hasMore flag.
 */
const transformBatchRegistryPaginatedLookupResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformBatchRegistryLookupItem, {
    includeLoadMore: true,
  });

/**
 * Transforms raw warehouse lookup rows into lookup-compatible format.
 *
 * @param {Array<Object>} rows - Raw rows from the warehouse lookup query
 * @returns {Array<Object>} Transformed lookup items
 */
const transformWarehouseLookupRows = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    value: row.warehouse_id,
    label: `${row.warehouse_name} (${row.location_name}${row.warehouse_type_name ? ' - ' + row.warehouse_type_name : ''})`,
    metadata: {
      locationId: row.location_id,
    },
  }));
};

/**
 * Transforms a result set of lot adjustment type records into lookup-friendly options,
 * applying formatting for value, label, and associated action type.
 *
 * @param {Array<Object>} rows - Raw query result rows from lot_adjustment_types join.
 * @returns {Array<{ value: string, label: string, actionTypeId: string }>}
 * Transformed options for use in dropdowns or autocomplete components.
 *
 * @example
 * const transformed = transformLotAdjustmentLookupOptions(rows);
 * // [
 * // { value: '581f...', label: 'Adjustment Type A', actionTypeId: 'a7c1...' },
 * // { value: '1234...', label: 'Adjustment Type B', actionTypeId: 'b2d4...' }
 * // ]
 */
const transformLotAdjustmentLookupOptions = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    value: row.lot_adjustment_type_id,
    label: row.name,
    actionTypeId: row.inventory_action_type_id,
  }));
};

/**
 * Transforms a single raw customer record into a lookup-friendly format.
 *
 * Adds a `hasAddress` boolean flag indicating whether the customer
 * has at least one address assigned.
 *
 * @param {{
 *   id: string,
 *   firstname: string,
 *   lastname: string,
 *   email: string | null,
 *   has_address?: boolean
 * }} row - The raw customer record from the database query.
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   hasAddress: boolean
 * }} The transformed lookup item with ID, label, and address status.
 *
 * @example
 * const result = transformCustomerLookup({
 *   id: 'abc123',
 *   firstname: 'John',
 *   lastname: 'Doe',
 *   email: 'john@example.com',
 *   has_address: true
 * });
 * // result: { id: 'abc123', label: 'John Doe (john@example.com)', hasAddress: true }
 */
const transformCustomerLookup = (row) => ({
  id: row.id,
  label: `${getFullName(row.firstname, row.lastname)} (${row.email || 'no-email'})`,
  hasAddress: row.has_address === true, // Normalize to boolean
});

/**
 * Transforms a paginated result of customer records for lookup usage,
 * applying a row-level transformer and formatting the response for load-more support.
 *
 * @param {Object} paginatedResult - The raw paginated query result.
 * @returns {Object} Transformed response including items, limit, offset, and hasMore flag.
 */
const transformCustomerPaginatedLookupResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformCustomerLookup, {
    includeLoadMore: true,
  });

/**
 * Transforms a single raw address row into a minimal client-friendly format
 * for customer address lookup purposes (e.g., dropdown selections).
 *
 * The returned object includes essential fields for display,
 * including a formatted address string.
 *
 * @param {Object} row - A raw address row from the database
 * @param {string} row.id - Unique address ID
 * @param {string} row.recipient_name - Name of the recipient
 * @param {string|null} row.label - Optional label (e.g., 'Shipping', 'Billing')
 * @param {string} row.address_line1
 * @param {string|null} row.address_line2
 * @param {string} row.city
 * @param {string|null} row.state
 * @param {string} row.postal_code
 * @param {string} row.country
 * @param {string|null} row.region
 * @returns {Object} Transformed address object for lookup UI
 */
const transformCustomerAddressLookupRow = (row) => {
  const base = {
    id: row.id,
    recipient_name: row.recipient_name,
    label: row.label ?? null,
    formatted_address: formatAddress(row),
  };
  return cleanObject(base);
};

/**
 * Transforms an array of raw address rows into minimal client-friendly format
 * for use in customer address lookup features (e.g., dropdowns).
 *
 * @param {Array<Object>} rows - Raw address rows from the database
 * @returns {Array<Object>} Transformed lookup address objects
 */
const transformCustomerAddressesLookupResult = (rows) =>
  transformRows(rows, transformCustomerAddressLookupRow);

/**
 * Transforms a raw order type row into a minimal lookup object.
 *
 * @param {Object|null|undefined} row - Raw DB row
 * @returns {Object|null} Transformed object or null if invalid
 */
const transformOrderTypeLookup = (row) => {
  if (!row || typeof row !== 'object') return null;

  const result = {
    id: row.id,
    name: row.name,
    category: row.category,
  };

  return cleanObject(result);
};

/**
 * Converts an array of raw DB rows into `{ value, label }` list.
 *
 * @param {Array} rows - DB rows
 * @returns {Array} List of lookup options
 */
const transformOrderTypeLookupResult = (rows) => {
  return transformRows(rows, (row) => transformOrderTypeLookup(row));
};

/**
 * Transforms a single raw payment method row into a dropdown option format.
 *
 * @param {Object} row - Raw DB row from payment_methods query
 * @param {string} row.id - UUID of the payment method
 * @param {string} row.name - Display name of the payment method
 * @returns {{ id: string, label: string }} - Transformed dropdown option
 */
const transformPaymentMethodLookup = (row) => {
  const result = {
    id: row.id,
    label: row.name,
  };

  return cleanObject(result);
};

/**
 * Transforms a paginated raw payment method result into a dropdown-compatible format.
 *
 * Each row will be transformed using `transformPaymentMethodLookup`, returning a list
 * of `{ label, value }` items and a `hasMore` flag for pagination.
 *
 * @param {Object} paginatedResult - Raw-paginated query result
 * @param {Object[]} paginatedResult.rows - Array of payment method rows
 * @param {boolean} paginatedResult.hasMore - Whether more results exist
 * @returns {{ items: { label: string, value: string }[], hasMore: boolean }} Transformed result
 */
const transformPaymentMethodPaginatedLookupResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformPaymentMethodLookup, {
    includeLoadMore: true,
  });

module.exports = {
  transformBatchRegistryPaginatedLookupResult,
  transformWarehouseLookupRows,
  transformLotAdjustmentLookupOptions,
  transformCustomerPaginatedLookupResult,
  transformCustomerAddressesLookupResult,
  transformOrderTypeLookupResult,
  transformPaymentMethodPaginatedLookupResult,
};
