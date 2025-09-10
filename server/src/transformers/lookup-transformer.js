const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const {
  transformPaginatedResult,
  transformRows,
  transformIdNameToIdLabel,
  includeFlagsBasedOnAccess,
} = require('../utils/transformer-utils');
const { getFullName } = require('../utils/name-utils');
const { formatPackagingMaterialLabel } = require('../utils/string-utils');
const { formatAddress } = require('../utils/address-utils');
const { formatDiscount } = require('../utils/discount-utils');
const { formatTaxRateLabel } = require('../utils/tax-rate-utils');

/**
 * Transforms a raw batch registry row into a lookup-friendly shape.
 *
 * @param {object} row - A single row from the DB result.
 * @param {string} row.batch_registry_id - ID of the batch registry entry.
 * @param {string} row.batch_type - Type of batch (e.g., product, packaging).
 * @param {string} [row.product_batch_id] - ID of the associated product batch.
 * @param {string} [row.product_lot_number] - Product batch lot number.
 * @param {string} [row.product_expiry_date] - Product batch expiry date.
 * @param {string} [row.product_name] - Name of the product (used by getProductDisplayName).
 * @param {string} [row.brand] - Product brand (used by getProductDisplayName).
 * @param {string} [row.sku] - SKU value (used by getProductDisplayName).
 * @param {string} [row.country_code] - Country code for product (used by getProductDisplayName).
 * @param {string} [row.size_label] - Size label for product (used by getProductDisplayName).
 * @param {string} [row.packaging_material_batch_id] - ID of the packaging material batch.
 * @param {string} [row.material_lot_number] - Packaging material lot number.
 * @param {string} [row.material_expiry_date] - Packaging material expiry date.
 * @param {string} [row.material_snapshot_name] - Snapshot name of material batch.
 * @param {string} [row.received_label_name] - Received label name for packaging material.
 *
 * @returns {object} Transformed lookup object with optional product and packaging material details.
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
 * Transforms raw warehouse lookup rows into a lookup-compatible format.
 *
 * @param {Array<Object>} rows - Raw rows from the warehouse lookup query.
 * @param {string} rows[].warehouse_id - Unique identifier of the warehouse.
 * @param {string} rows[].warehouse_name - Display name of the warehouse.
 * @param {string} rows[].location_name - Name of the associated location.
 * @param {string} [rows[].warehouse_type_name] - Optional warehouse type name to include in label.
 * @param {string} rows[].location_id - ID of the associated location (used in metadata).
 *
 * @returns {Array<Object>} Transformed lookup items with shape:
 *   - value: string (warehouse ID)
 *   - label: string (formatted name + location + type)
 *   - metadata: { locationId: string }
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
 * formatting each item with value, label, and associated action type ID.
 *
 * @param {Array<{
 *   lot_adjustment_type_id: string,
 *   name: string,
 *   inventory_action_type_id: string
 * }>} rows - Raw query result rows from lot_adjustment_types join.
 *
 * @returns {Array<{ value: string, label: string, actionTypeId: string }>} Transformed options
 * suitable for use in dropdowns, autocomplete inputs, or select components.
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
 * Transforms a single raw customer record into a lookup-friendly object.
 *
 * Constructs a `label` using the customer's full name and email,
 * adds `hasAddress` as a boolean flag, and conditionally appends
 * UI flags (e.g. `isActive`) based on the current user's access level.
 *
 * Used in lookup dropdowns, autocomplete inputs, or anywhere customer
 * lookup data is needed in compact UI format.
 *
 * @param {{
 *   id: string,
 *   firstname: string,
 *   lastname: string,
 *   email: string | null,
 *   has_address?: boolean,
 *   status_id?: string,
 * }} row - Raw customer row from the database.
 *
 * @param {object} userAccess - Object containing access-level flags (e.g., from `evaluateCustomerLookupAccessControl()`).
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   hasAddress: boolean,
 *   isActive?: boolean,
 *   [key: string]: any
 * }} Transformed lookup object with `id`, `label`, `hasAddress`, and optional enriched flags.
 *
 * @example
 * const result = transformCustomerLookup({
 *   id: 'abc123',
 *   firstname: 'John',
 *   lastname: 'Doe',
 *   email: 'john@example.com',
 *   has_address: true
 * }, userAccess);
 *
 * // result:
 * // {
 * // id: 'abc123',
 * // label: 'John Doe (john@example.com)',
 * // hasAddress: true,
 * // isActive: true
 * // }
 */
const transformCustomerLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const fullName = getFullName(row.firstname, row.lastname);
  const email = row.email || 'no-email';
  const label = `${fullName} (${email})`;
  
  const base = transformIdNameToIdLabel({ ...row, name: label });
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return {
    ...base,
    hasAddress: row?.has_address === true,
    ...flagSubset,
  };
};

/**
 * Transforms a paginated set of raw customer records into a UI-friendly
 * format for dropdowns or infinite-scroll selectors.
 *
 * Applies row-level transformation (`transformCustomerLookup`) to each record,
 * and standardizes the output for use with load-more patterns.
 *
 * @param {{
 *   data: Array<object>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number
 *   }
 * }} paginatedResult - Raw result from a repository-level paginated query.
 *
 * @param {object} userAccess - Access flags used to enrich each row with permission-aware fields.
 *
 * @returns {{
 *   items: Array<{
 *     id: string,
 *     label: string,
 *     hasAddress: boolean,
 *     [key: string]: any
 *   }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }} Final lookup result formatted for dropdown/infinite-scroll use.
 *
 * @example
 * const result = transformCustomerPaginatedLookupResult(paginatedResult, userAccess);
 * // result = { items: [...], offset: 0, limit: 20, hasMore: true }
 */
const transformCustomerPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformCustomerLookup(row, userAccess),
    { includeLoadMore: true }
  );

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
 * Transforms a raw order type row into a dropdown-compatible lookup object.
 *
 * This function is used to format `order_types` records for use in UI components like dropdowns.
 *
 * Behavior:
 * - Always includes `value` (order type ID) and `label` (order type name, optionally prefixed with category).
 * - Uses `transformIdNameToIdLabel` for consistent transformation.
 * - Includes `isRequiredPayment` to indicate whether the order type expects payment.
 * - If the user can view all categories, the `label` is prefixed with the category (e.g., "sales - Return").
 * - If the user can view inactive statuses, `isActive` is included to support disabled option rendering.
 * - May include other flags from `includeFlagsBasedOnAccess()` (e.g., `category`) as needed by UI.
 *
 * Returns `null` if the input row is invalid.
 *
 * @param {Object|null|undefined} row - Raw DB row from the `order_types` table.
 * @param {Object} userAccess - Evaluated access flags for the authenticated user.
 * @param {boolean} userAccess.canViewAllCategories - Whether to include category prefix in the label.
 * @param {boolean} userAccess.canViewAllStatuses - Whether to include the `isActive` flag.
 *
 * @returns {{
 *   value: string,
 *   label: string,
 *   isRequiredPayment: boolean,
 *   isActive?: boolean,
 *   category?: string
 * } | null} A dropdown-compatible option object, or `null` if input is invalid.
 */
const transformOrderTypeLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const label = userAccess?.canViewAllCategories
    ? `${row.category} - ${row.name}`
    : row.name;
  
  const base = transformIdNameToIdLabel({ ...row, name: label });
  
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return {
    ...base,
    isRequiredPayment: !!row?.requires_payment,
    ...flagSubset,
  };
};

/**
 * Transforms an array of raw order type rows into a dropdown-compatible list.
 *
 * Each row is transformed using `transformOrderTypeLookup`, including conditional flags
 * like `isActive` and category-prefixed labels based on user permissions.
 *
 * @param {Object[]} rows - Array of raw order type rows from the DB.
 * @param {Object} userAccess - Evaluated user permission flags.
 * @param {boolean} userAccess.canViewAllCategories - Whether to prefix category in label.
 * @param {boolean} userAccess.canViewAllStatuses - Whether to include `isActive`.
 *
 * @returns {Array<{ value: string, label: string, isActive?: boolean }>} List of lookup options.
 */
const transformOrderTypeLookupResult = (rows, userAccess) => {
  return transformRows(rows, (row) =>
    transformOrderTypeLookup(row, userAccess)
  );
};

/**
 * Transforms a single raw payment method row into a dropdown option format.
 *
 * Adds flags like `isActive` based on user permissions to support UI logic,
 * such as disabling inactive options for users with elevated access.
 *
 * @param {Object} row - Raw DB row from the `payment_methods` query.
 * @param {string} row.id - UUID of the payment method.
 * @param {string} row.name - Display name of the payment method.
 * @param {boolean} row.is_active - Whether the payment method is active.
 * @param {Object} userAccess - Evaluated user permission result.
 * @param {boolean} userAccess.canViewAllStatuses - Whether the user can see inactive options.
 * @returns {{ value: string, label: string, isActive?: boolean }} Dropdown-compatible option.
 */
const transformPaymentMethodLookup = (row, userAccess) => {
  const base = transformIdNameToIdLabel(row);
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return {
    ...base,
    ...flagSubset,
  };
};

/**
 * Transforms a paginated payment method result into a dropdown-compatible format.
 *
 * Each row is transformed using `transformPaymentMethodLookup`, adding optional flags like
 * `isActive` for elevated users. Used for paginated dropdown components.
 *
 * @param {Object} paginatedResult - Raw paginated DB query result.
 * @param {Object[]} paginatedResult.rows - Array of raw payment method rows.
 * @param {boolean} paginatedResult.hasMore - Whether more results are available for pagination.
 * @param {Object} userAccess - Evaluated user permission result.
 * @param {boolean} userAccess.canViewAllStatuses - Whether the user can see inactive options.
 * @returns {{
 *   items: Array<{ value: string, label: string, isActive?: boolean }>,
 *   hasMore: boolean
 * }} Transformed dropdown-compatible result with pagination support.
 */
const transformPaymentMethodPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformPaymentMethodLookup(row, userAccess),
    { includeLoadMore: true }
  );

/**
 * Transforms an enriched discount row into a UI-friendly structure for dropdowns.
 *
 * - Always includes `id` and a `label` string.
 * - The `label` combines the discount name with its formatted value
 *   (e.g., `"Subscriber Reward (5.00%)"`).
 * - Optionally includes flags such as `isActive` and `isValidToday` if allowed by user access.
 *
 * @param {object} row - Enriched discount row from the database.
 * @param {string} row.id - Unique identifier of the discount.
 * @param {string} row.name - Human-readable discount name.
 * @param {string} row.discount_type - Type of discount (e.g., "PERCENTAGE", "FIXED").
 * @param {string|number} row.discount_value - Discount value to format and append.
 * @param {boolean} [row.isActive] - Whether the discount is active.
 * @param {boolean} [row.isValidToday] - Whether the discount is valid today.
 * @param {object} userAccess - User access control context.
 *
 * @returns {{ id: string, label: string, isActive?: boolean, isValidToday?: boolean }}
 * Object ready for UI dropdowns, with a combined label and optional flags.
 *
 * @example
 * const row = {
 *   id: "24c73d12",
 *   name: "Subscriber Reward",
 *   discount_type: "PERCENTAGE",
 *   discount_value: "5.00",
 *   isActive: true,
 *   isValidToday: true
 * };
 *
 * const result = transformDiscountLookup(row, userAccess);
 * // => {
 * //   id: "24c73d12",
 * //   label: "Subscriber Reward (5.00%)",
 * //   isActive: true,
 * //   isValidToday: true
 * // }
 */
const transformDiscountLookup = (row, userAccess) => {
  const formattedValue = formatDiscount(row.discount_type, row.discount_value); // e.g. "5.00%"
  const label = `${row.name} (${formattedValue})`;
  
  const base = transformIdNameToIdLabel(row);
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return {
    ...base,
    label,
    ...flagSubset,
  };
};

/**
 * Transforms paginated discount records for lookup dropdowns.
 *
 * @param {Object} paginatedResult - Raw DB paginated result
 * @param {Object} userAccess - Evaluated access control flags
 * @returns {{ items: { id: string, label: string, isActive: boolean, isValidToday: boolean }[], hasMore: boolean }}
 */
const transformDiscountPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformDiscountLookup(row, userAccess),
    { includeLoadMore: true }
  );

/**
 * Transforms a tax rate row into a UI-friendly dropdown format.
 *
 * Constructs a formatted label using tax name, rate, and optional province or region,
 * via `formatTaxRateLabel()`. Includes computed flags like `isActive` and `isValidToday`
 * only if permitted by user access.
 *
 * @param {{
 *   id: string,
 *   name: string,
 *   rate: number,
 *   province?: string,
 *   region?: string,
 *   is_active?: boolean,
 *   valid_from?: string | Date,
 *   valid_to?: string | Date,
 *   isActive?: boolean,
 *   isValidToday?: boolean
 * }} row - Enriched tax rate record with status, rate, and location info.
 *
 * @param {Object} userAccess - User access control context.
 * @param {boolean} [userAccess.canViewAllStatuses] - Whether the user can see inactive tax rates.
 * @param {boolean} [userAccess.canViewAllValidLookups] - Whether the user can see expired/future tax rates.
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   isActive?: boolean,
 *   isValidToday?: boolean
 * }} Transformed object for dropdowns with a descriptive label and optional status flags.
 */
const transformTaxRateLookup = (row, userAccess) => {
  const label = formatTaxRateLabel(row);
  
  const base = transformIdNameToIdLabel({ ...row, name: label });
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return {
    ...base,
    ...flagSubset,
  };
};

/**
 * Transforms paginated tax rate records for lookup dropdowns.
 *
 * @param {Object} paginatedResult - Raw DB paginated result
 * @param {Object} userAccess - Evaluated access control flags
 * @returns {{ items: { id: string, label: string }[], hasMore: boolean }}
 */
const transformTaxRatePaginatedLookupResult = (paginatedResult, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformTaxRateLookup(row, userAccess),
    { includeLoadMore: true }
  );

/**
 * Transforms a delivery method row into a UI-friendly dropdown format.
 *
 * Includes `isPickupLocation` always, and conditionally includes `isActive` based on user access.
 *
 * @param {{
 *   id: string,
 *   method_name: string,
 *   is_pickup_location?: boolean,
 *   is_active?: boolean
 * }} row - Raw delivery method record.
 *
 * @param {Object} userAccess - User access control context.
 * @param {boolean} [userAccess.canViewAllStatuses] - Whether the user can view inactive records.
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   isPickupLocation: boolean,
 *   isActive?: boolean
 * }} Transformed delivery method object.
 */
const transformDeliveryMethodLookup = (row, userAccess) => {
  const base = transformIdNameToIdLabel(row);
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
  
  return cleanObject({
    ...base,
    isPickupLocation: row?.is_pickup_location ?? false,
    ...flagSubset,
  });
};

/**
 * Transforms paginated delivery method records for lookup dropdowns.
 *
 * @param {Object} paginatedResult - Raw DB paginated result
 * @param {Object} userAccess - Evaluated access control flags
 * @returns {{ items: { id: string, label: string }[], hasMore: boolean }}
 */
const transformDeliveryMethodPaginatedLookupResult = (
  paginatedResult,
  userAccess
) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformDeliveryMethodLookup(row, userAccess),
    { includeLoadMore: true }
  );

/**
 * Transforms a raw SKU lookup row from the database into a simplified object
 * containing only `id` and `label`, for use in dropdowns or lookup UI components.
 *
 * The label is constructed using the product name and SKU, optionally including
 * the barcode for better identification in long lists.
 *
 * If `userAccess` is provided, additional flags such as `isActive`, `isValidToday`,
 * etc. may be conditionally included based on access level.
 *
 * Always includes an `isNormal` flag:
 * - Uses `row.isNormal` if present (from backend enrichment).
 * - Defaults to `true` if missing.
 *
 * @param {Object} row - Raw row from the SKU lookup query.
 * @param {Object} [options] - Optional transformation settings.
 * @param {boolean} [options.includeBarcode=false] - Whether to include the barcode in the label text.
 * @param {Object} [userAccess] - User access context to conditionally include visibility or validation flags.
 *
 * @returns {Object|null} - Transformed object with at least `id`, `label`, and `isNormal`,
 *                          plus flags if permitted; or `null` if the input row is invalid.
 */
const transformSkuLookupRow = (row, { includeBarcode = false} = {}, userAccess) => {
  const product_name = getProductDisplayName(row);
  
  const base = transformIdNameToIdLabel({
    id: row.id,
    name: includeBarcode
      ? `${product_name} (${row.sku}) • Barcode: ${row.barcode}`
      : `${product_name} (${row.sku})`,
  });
  
  const flagSubset = includeFlagsBasedOnAccess?.(row, userAccess);
  
  return cleanObject({
    ...base,
    ...flagSubset,
    isNormal: row.isNormal ?? true,
  });
};

/**
 * Transforms a paginated SKU lookup result set into a frontend-friendly format
 * using `transformSkuLookupRow`, with support for barcode inclusion and
 * conditional flag visibility based on user access permissions.
 *
 * Each row is transformed into an `{ id, label }` object, and optional flags
 * such as `isAbnormal`, `abnormalReasons`, `isActive`, and `isValidToday` may be
 * included depending on the `userAccess` context.
 *
 * @param {Object} paginatedResult - Raw paginated result from SKU lookup query,
 *                                   expected to include `data` and `pagination` keys.
 * @param {Object} [options={}] - Transformation options.
 * @param {boolean} [options.includeBarcode=false] - Whether to include barcode in each label.
 * @param {Object} [userAccess] - User access context to control visibility of additional flags.
 * @param {boolean} [userAccess.allowAllSkus] - Whether the user can view SKUs regardless of validation state.
 * @param {boolean} [userAccess.canViewAllStatuses] - Whether to expose `isActive`.
 * @param {boolean} [userAccess.canViewAllValidLookups] - Whether to expose `isValidToday`.
 *
 * @returns {Object} Transformed paginated result with:
 *   - `items`: array of `{ id, label, ...flags }`
 *   - `hasMore`: boolean indicating whether more pages are available
 */
const transformSkuPaginatedLookupResult = (paginatedResult, options = {}, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformSkuLookupRow(row, options, userAccess),
    { includeLoadMore: true }
  );

/**
 * Transforms a pricing row into a UI-friendly dropdown option.
 *
 * Constructs a human-readable `label` using product name, SKU, pricing type name, and price,
 * with configurable display granularity.
 *
 * Always includes `id` and `label`. Additional fields like `price`, `pricingTypeName`,
 * `locationName`, and flags (`isActive`, `isValidToday`) are conditionally included
 * based on the `labelOnly` option and the user's access permissions.
 *
 * - `isActive` and `isValidToday` are included if the user has permission,
 *   even when `labelOnly` is `true`.
 * - `locationName` is included only if the user has permission and `labelOnly` is `false`.
 *
 * @param {Object} row - Raw pricing row from the database.
 * @param {string} row.id - Pricing ID.
 * @param {string|number} row.price - Pricing amount.
 * @param {string} row.sku - Associated SKU string.
 * @param {string} [row.product_name] - Product display name.
 * @param {string} [row.price_type] - Pricing type name (e.g., Retail, Wholesale).
 * @param {string} [row.location_name] - Location name (if applicable).
 * @param {boolean} [row.isActive] - Whether the pricing row is currently active.
 * @param {boolean} [row.isValidToday] - Whether the pricing row is valid today.
 *
 * @param {Object} userAccess - Flags representing user permission context.
 * @param {boolean} [userAccess.canViewAllStatuses] - If true, allows visibility of all pricing statuses.
 * @param {boolean} [userAccess.canViewAllValidLookups] - If true, allows visibility of expired/future-dated prices.
 *
 * @param {Object} [options={}] - Display behavior options.
 * @param {boolean} [options.showSku=true] - Whether to include product name and SKU in the label.
 * @param {boolean} [options.showPriceType=true] - Whether to include pricing type name in the label.
 * @param {boolean} [options.showPriceInLabel=true] - Whether to include the price in the label.
 * @param {boolean} [options.labelOnly=false] - If true, minimal display: includes only `id`, `label`,
 *   and optionally `isActive`/`isValidToday` if the user has permission.
 *
 * @returns {{
 *   id: string;
 *   label: string;
 *   price?: string | number;
 *   pricingTypeName?: string;
 *   locationName?: string;
 *   isActive?: boolean;
 *   isValidToday?: boolean;
 * }} Transformed object for dropdown usage.
 */
const transformPricingLookupRow = (
  row,
  userAccess,
  {
    showSku = true,
    showPriceType = true,
    showPriceInLabel = true,
    labelOnly = false, // For minimal display (e.g., during sales order creation)
  } = {}
) => {
  const productDisplayName = getProductDisplayName(row);
  
  const labelParts = [];
  
  if (showSku) {
    labelParts.push(`${productDisplayName} (${row.sku})`);
  }
  
  if (showPriceType) {
    labelParts.push(row.price_type);
  }
  
  if (showPriceInLabel) {
    labelParts.push(`$${row.price}`);
  }
  
  const showLocation =
    userAccess?.canViewAllStatuses || userAccess?.canViewAllValidLookups;
  
  const showFlags =
    userAccess?.canViewAllStatuses || userAccess?.canViewAllValidLookups;
  
  // Always include id and label
  const base = {
    id: row.id,
    label: labelParts.join(' · '),
  };
  
  // Optionally add more fields
  if (!labelOnly) {
    if (showLocation && row.location_name) {
      base.locationName = row.location_name;
    }
    
    base.price = row.price;
    base.pricingTypeName = row.price_type;
    
    const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
    Object.assign(base, flagSubset);
  } else if (labelOnly && showFlags) {
    // Still include flags if a user has permission, even in labelOnly mode
    const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
    Object.assign(base, flagSubset);
  }
  
  return cleanObject(base);
};

/**
 * Transforms paginated pricing records into dropdown-compatible lookup format.
 *
 * Applies user access rules for conditional fields like `isActive`, `isValidToday`,
 * and `locationName`, and returns transformed pricing options.
 *
 * @param {Object} paginatedResult - Raw paginated DB result (e.g., from paginateQueryByOffset)
 * @param {Object} userAccess - Evaluated access control flags
 * @param {Object} [options] - Optional display config for label formatting
 * @param {boolean} [options.showSku=true] - Include SKU in label
 * @param {boolean} [options.showPriceType=true] - Include pricing type name in label
 * @param {boolean} [options.showPriceInLabel=true] - Include price in label
 * @param {boolean} [options.labelOnly=false] - Return only base display fields
 *
 * @returns {{ items: { id: string, label: string }[], hasMore: boolean }}
 */
const transformPricingPaginatedLookupResult = (
  paginatedResult,
  userAccess,
  options = {}
) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformPricingLookupRow(row, userAccess, options),
    { includeLoadMore: true }
  );

/**
 * Transforms a raw packaging-material row into a lookup-friendly object `{ id, label }`,
 * conditionally enriched with flags for the UI.
 *
 * - Builds a human-readable label via `formatPackagingMaterialLabel(row)`.
 * - Converts to `{ id, label }` using `transformIdNameToIdLabel`.
 * - Optionally merges extra flags from `includeFlagsBasedOnAccess(row, userAccess)`.
 * - **Includes `isArchived` ONLY if `userAccess.canViewAllStatuses` is true**; otherwise it is omitted.
 *
 * @param {object} row - Raw DB row for a packaging material.
 * @param {string} row.id - Material ID (required).
 * @param {boolean} [row.is_archived] - Whether the material is archived.
 * @param {object} [userAccess] - Access flags used to decide which fields to expose it.
 * @param {boolean} [userAccess.canViewAllStatuses] - If true, expose `isArchived`.
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   isArchived?: boolean
 * } | null} Lookup item, or `null` if invalid.
 *
 * @example
 * // With canViewAllStatuses:
 * // -> { id, label, isArchived: false }
 * // Without:
 * // -> { id, label }
 */
const transformPackagingMaterialLookupRow = (row, userAccess) => {
  if (!row || typeof row !== 'object' || !row.id) return null;
  
  const label = formatPackagingMaterialLabel(row);
  if (!label) return null;
  
  const base = transformIdNameToIdLabel({ id: row.id, name: label });
  
  const flagSubset =
    (typeof includeFlagsBasedOnAccess === 'function'
      ? includeFlagsBasedOnAccess(row, userAccess)
      : {}) || {};
  
  const out = {
    ...base,
    ...flagSubset,
  };
  
  // Only expose isArchived to users allowed to view all statuses
  if (userAccess?.canViewAllStatuses) {
    out.isArchived = row?.is_archived === true;
  }
  
  return cleanObject(out);
};

/**
 * Transforms a paginated repository result of packaging-material rows into a
 * lookup-ready payload using `transformPackagingMaterialLookupRow`.
 *
 * Intended for dropdowns / autocomplete with load-more behavior.
 *
 * @param {{
 *   data: Array<object>,
 *   pagination: { offset: number, limit: number, totalRecords: number }
 * }} paginatedResult - Raw-paginated result from the repository.
 * @param {object} [userAccess] - Access flags forwarded to the row transformer.
 *
 * @returns {{
 *   items: Array<{ id: string, label: string, isArchived: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }} Lookup payload with pagination metadata.
 *
 * @example
 * const result = transformPackagingMaterialPaginatedLookupResult(repoResult, access);
 * // { items: [...], offset: 0, limit: 20, hasMore: true }
 */
const transformPackagingMaterialPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformPackagingMaterialLookupRow(row, userAccess),
    { includeLoadMore: true }
  );

module.exports = {
  transformBatchRegistryPaginatedLookupResult,
  transformWarehouseLookupRows,
  transformLotAdjustmentLookupOptions,
  transformCustomerPaginatedLookupResult,
  transformCustomerAddressesLookupResult,
  transformOrderTypeLookupResult,
  transformPaymentMethodPaginatedLookupResult,
  transformDiscountPaginatedLookupResult,
  transformTaxRatePaginatedLookupResult,
  transformDeliveryMethodPaginatedLookupResult,
  transformSkuPaginatedLookupResult,
  transformPricingPaginatedLookupResult,
  transformPackagingMaterialPaginatedLookupResult,
};
