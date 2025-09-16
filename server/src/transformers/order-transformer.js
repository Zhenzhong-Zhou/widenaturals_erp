const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { makeAudit, compactAudit } = require('../utils/audit-utils');
const { formatPackagingMaterialLabel } = require('../utils/packaging-material-utils');
const { formatDiscount } = require('../utils/discount-utils');
const { formatTaxRateLabel } = require('../utils/tax-rate-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { buildAddress } = require('../utils/address-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Header row as returned by your SQL (only fields you actually read here).
 * Add more @property lines as needed.
 * @typedef {Object} OrderRow
 * @property {string}        order_id
 * @property {string}        order_number
 * @property {string|Date|null} order_date
 * @property {string|Date|null} status_date
 * @property {string|null}   note
 * @property {string}        order_type_id
 * @property {string}        order_type_name
 * @property {string}        order_status_id
 * @property {string}        order_status_name
 * @property {string}        order_status_code
 * @property {string}        order_code
 * @property {string}        customer_id
 * @property {string|null}   customer_firstname
 * @property {string|null}   customer_lastname
 * @property {string|null}   customer_email
 * @property {string|null}   customer_phone
 * @property {string|null}   payment_status_id
 * @property {string|null}   payment_status_name
 * @property {string|null}   payment_status_code
 * @property {string|null}   payment_method_id
 * @property {string|null}   payment_method_name
 * @property {string|null}   currency_code
 * @property {number|null}   exchange_rate
 * @property {number|null}   base_currency_amount
 * @property {string|null}   discount_id
 * @property {string|null}   discount_name
 * @property {string|null}   discount_type
 * @property {number|null}   discount_value
 * @property {number|null}   discount_amount
 * @property {string|null}   tax_rate_id
 * @property {string|null}   tax_rate_name
 * @property {number|null}   tax_rate_percent
 * @property {string|null}   tax_rate_province
 * @property {string|null}   tax_rate_region
 * @property {number|null}   tax_amount
 * @property {number|null}   shipping_fee
 * @property {number|null}   total_amount
 * @property {string|null}   delivery_method_id
 * @property {string|null}   delivery_method_name
 * @property {object|undefined} sales_order_metadata
 * // order audit fields (consumed via prefix 'order_')
 * @property {string|Date|null} order_created_at
 * @property {string|null}   order_created_by
 * @property {string|null}   order_created_by_firstname
 * @property {string|null}   order_created_by_lastname
 * @property {string|Date|null} order_updated_at
 * @property {string|null}   order_updated_by
 * @property {string|null}   order_updated_by_firstname
 * @property {string|null}   order_updated_by_lastname
 * // shipping_ and billing_ address fields (used by buildAddress):
 * @property {string|null} shipping_address_id
 * @property {string|null} shipping_customer_id
 * @property {string|null} shipping_full_name
 * @property {string|null} shipping_phone
 * @property {string|null} shipping_email
 * @property {string|null} shipping_label
 * @property {string|null} shipping_address_line1
 * @property {string|null} shipping_address_line2
 * @property {string|null} shipping_city
 * @property {string|null} shipping_state
 * @property {string|null} shipping_postal_code
 * @property {string|null} shipping_country
 * @property {string|null} shipping_region
 * @property {string|null} billing_address_id
 * @property {string|null} billing_customer_id
 * @property {string|null} billing_full_name
 * @property {string|null} billing_phone
 * @property {string|null} billing_email
 * @property {string|null} billing_label
 * @property {string|null} billing_address_line1
 * @property {string|null} billing_address_line2
 * @property {string|null} billing_city
 * @property {string|null} billing_state
 * @property {string|null} billing_postal_code
 * @property {string|null} billing_country
 * @property {string|null} billing_region
 */

/**
 * Item row as returned by your SQL (only fields you read here).
 * @typedef {Object} OrderItemRow
 * @property {string}      order_item_id
 * @property {string}      order_id
 * @property {number}      quantity_ordered
 * @property {string|null} price_id
 * @property {number|null} listed_price
 * @property {string|null} price_type_name
 * @property {number|null} item_price
 * @property {number|null} item_subtotal
 * @property {string|null} item_status_id
 * @property {string|null} item_status_name
 * @property {string|null} item_status_code
 * @property {string|Date|null} item_status_date
 * @property {object|undefined} item_metadata
 * // SKU fields (nullable for packaging-only lines)
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * // Packaging material fields (nullable for SKU lines)
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_unit
 * @property {number|null} packaging_material_length_cm
 * @property {number|null} packaging_material_width_cm
 * @property {number|null} packaging_material_height_cm
 * // Optional product label fields for display name
 * @property {string|null} brand
 * @property {string|null} product_name
 * @property {string|null} country_code
 * @property {string|null} size_label
 * // item audit fields (consumed via prefix 'item_')
 * @property {string|Date|null} item_created_at
 * @property {string|null} item_created_by
 * @property {string|null} item_created_by_firstname
 * @property {string|null} item_created_by_lastname
 * @property {string|Date|null} item_updated_at
 * @property {string|null} item_updated_by
 * @property {string|null} item_updated_by_firstname
 * @property {string|null} item_updated_by_lastname
 */

/**
 * Transforms a raw SQL result row from the `orders` query into a normalized `OrderListItem` object.
 *
 * - Flattens and normalizes aliased SQL columns into camelCase fields.
 * - Combines `created_by` and `updated_by` username parts into full names.
 * - Combines customer first and last names into a single `customerName` string.
 * - Defaults `numberOfItems` to 0 if null.
 * - Returns `null` if input row is falsy.
 * - Uses `cleanObject` to remove `null` or `undefined` fields as needed.
 *
 * @param {Object} row - A single raw row from the joined SQL result.
 * @param {string} row.id - Order UUID.
 * @param {string} row.order_number - Full order number (e.g., "SO-SSO-20250825-XYZ").
 * @param {string} [row.order_type] - Name of the order type.
 * @param {string} row.order_status_code - Machine-readable order status code.
 * @param {string} row.order_status_name - Human-readable order status name.
 * @param {string} row.order_date - ISO date string of the order.
 * @param {string} row.status_date - ISO date string of the last status update.
 * @param {string} row.created_at - ISO date string of creation timestamp.
 * @param {string} [row.created_by_firstname] - First name of creator.
 * @param {string} [row.created_by_lastname] - Last name of creator.
 * @param {string} row.updated_at - ISO date string of last update timestamp.
 * @param {string} [row.updated_by_firstname] - First name of updater.
 * @param {string} [row.updated_by_lastname] - Last name of updater.
 * @param {string} [row.note] - Internal note or comment.
 * @param {string} [row.customer_firstname] - Customer first name.
 * @param {string} [row.customer_lastname] - Customer last name.
 * @param {string} [row.payment_method] - Payment method name.
 * @param {string} [row.payment_status_name] - Payment status label.
 * @param {string} [row.payment_status_code] - Machine-readable payment status code.
 * @param {string} [row.delivery_method] - Delivery method name.
 * @param {number} [row.number_of_items] - Number of items in the order.
 *
 * @returns {OrderListItem | null} Normalized order object or `null` if input is falsy.
 *
 * @example
 * const raw = await db.query(...);
 * const orders = raw.rows.map(transformOrderRow);
 */
const transformOrderRow = (row) => {
  if (!row) return null;
  
  const createdBy = [row.created_by_firstname, row.created_by_lastname]
    .filter(Boolean)
    .join(' ') || null;
  
  const updatedBy = [row.updated_by_firstname, row.updated_by_lastname]
    .filter(Boolean)
    .join(' ') || null;
  
  const customerName = [row.customer_firstname, row.customer_lastname]
    .filter(Boolean)
    .join(' ') || null;
  
  return cleanObject({
    id: row.id,
    orderNumber: row.order_number,
    orderType: row.order_type || null,
    orderStatus: {
      code: row.order_status_code,
      name: row.order_status_name,
    },
    orderDate: row.order_date,
    statusDate: row.status_date,
    createdAt: row.created_at,
    createdBy,
    updatedAt: row.updated_at,
    updatedBy,
    note: row.note ?? null,
    customerName,
    paymentMethod: row.payment_method || null,
    paymentStatus:{
      name: row.payment_status_name || null,
      code: row.payment_status_code || null,
    },
    deliveryMethod: row.delivery_method || null,
    numberOfItems: row.number_of_items ?? 0,
  });
};

/**
 * Applies `transformOrderRow` to each item in a paginated query result.
 *
 * Used to convert raw SQL rows into structured order objects within paginated responses.
 * Relies on `transformPaginatedResult` utility to preserve pagination metadata.
 *
 * @param {Object} paginatedResult - Paginated query result from `paginateQuery`.
 * @param {Array<Object>} paginatedResult.data - Array of raw rows to transform.
 * @param {Object} paginatedResult.meta - Metadata including pagination info.
 * @returns {Object} Transformed result with `data` mapped via `transformOrderRow`.
 *
 * @example
 * const result = await getPaginatedOrders(...);
 * const output = transformPaginatedOrderTypes(result);
 */
const transformPaginatedOrderTypes = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformOrderRow(row)
  );
};

/**
 * Transform a flat sales order header + items (from a joined SQL query) into a structured object.
 *
 * Input:
 * - `orderRow` is expected to contain all header-level columns, prefixed columns for addresses (`shipping_`, `billing_`),
 *   and audit columns for the order (`order_*`).
 * - `orderItemRows` is an array of item-level rows containing columns for each order item, including:
 *   - Item audit fields (`item_*`)
 *   - SKU or packaging material details
 *   - Pricing, quantity, subtotal
 *   - Optional brand, product_name, size_label (for displayName generation)
 *
 * Behavior:
 * - Returns `null` if `orderRow` is falsy.
 * - Uses `makeAudit` + `compactAudit` to build deduplicated audit info for order and items.
 * - Includes optional `metadata` for order and/or items if the corresponding include*Metadata flags are true.
 * - Formats addresses via `buildAddress` (with `includeFormatted` / `formattedOnly` flags).
 * - Generates `displayName` for SKU lines using `getProductDisplayName` if `includeItemDisplayName=true`.
 * - Formats discount and tax labels using provided formatters.
 *
 * @param {OrderRow|null} orderRow
 * @param {OrderItemRow[]} orderItemRows
 * @param {object} [options]
 * @param {boolean} [options.includeOrderMetadata=false]
 * @param {boolean} [options.includeItemMetadata=false]
 * @param {boolean} [options.dedupeAudit=true]
 * @param {boolean} [options.includeFormattedAddresses=true]
 * @param {boolean} [options.formattedAddressesOnly=true]
 * @param {boolean} [options.includeItemDisplayName=true]
 *
 * @returns {object|null} Structured sales order object:
 * {
 *   id: string,
 *   orderNumber: string,
 *   orderDate: string|Date|null,
 *   statusDate: string|Date|null,
 *   note: string|null,
 *   type: { id: string, name: string },
 *   status: { id: string, name: string },
 *   customer: { id: string, fullName: string, email: string|null, phone: string|null },
 *   payment: { ... },
 *   discount: { id, name, label, amount }|null,
 *   tax: { id, name, amount }|null,
 *   shippingFee: number|null,
 *   totalAmount: number|null,
 *   deliveryMethod: { id: string, name: string },
 *   metadata?: object,
 *   shippingAddress: BuiltAddressUserFacing|null,
 *   billingAddress: BuiltAddressUserFacing|null,
 *   audit: Audit,
 *   items: Array<{
 *     id: string,
 *     orderId: string,
 *     quantityOrdered: number,
 *     priceId: string|null,
 *     listedPrice: number|null,
 *     priceTypeName: string|null,
 *     price: number|null,
 *     subtotal: number|null,
 *     status: { id: string, name: string, date: string|Date|null },
 *     metadata?: object,
 *     sku: { id: string, code: string, barcode: string|null }|null,
 *     packagingMaterial: { id: string, code: string, name: string }|null,
 *     audit: Audit,
 *     displayName?: string
 *   }>
 * }
 */
const transformOrderWithItems = (
  orderRow,
  orderItemRows,
  {
    includeOrderMetadata = false,
    includeItemMetadata = false,
    dedupeAudit = true,
    includeFormattedAddresses = true,
    formattedAddressesOnly = true,
    includeItemDisplayName = true,
  } = {}
) => {
  if (!orderRow) return null;
  
  // Build header audit from normalized (order_) fields
  const orderAuditFull = makeAudit(
    {
      order_created_at: orderRow.order_created_at,
      order_created_by: orderRow.order_created_by,
      order_created_by_firstname: orderRow.order_created_by_firstname,
      order_created_by_lastname: orderRow.order_created_by_lastname,
      order_updated_at: orderRow.order_updated_at,
      order_updated_by: orderRow.order_updated_by,
      order_updated_by_firstname: orderRow.order_updated_by_firstname,
      order_updated_by_lastname: orderRow.order_updated_by_lastname,
    },
    { dedupe: dedupeAudit, prefix: 'order_', includeIds: true, includeFullName: true }
  );
  
  const orderAudit = compactAudit(orderAuditFull, { keepIds: true, nameOnly: true });
  
  const items = (orderItemRows || []).map((item) => {
    const itemAudit = makeAudit(
      {
        item_created_at: item.item_created_at,
        item_created_by: item.item_created_by,
        item_created_by_firstname: item.item_created_by_firstname,
        item_created_by_lastname: item.item_created_by_lastname,
        item_updated_at: item.item_updated_at,
        item_updated_by: item.item_updated_by,
        item_updated_by_firstname: item.item_updated_by_firstname,
        item_updated_by_lastname: item.item_updated_by_lastname,
      },
      { dedupe: dedupeAudit, prefix: 'item_' }
    );
    
    const base = {
      id: item.order_item_id,
      orderId: item.order_id,
      quantityOrdered: item.quantity_ordered,
      priceId: item.price_id,
      listedPrice: item.listed_price,
      priceTypeName: item.price_type_name,
      price: item.item_price,
      subtotal: item.item_subtotal,
      status: {
        id: item.item_status_id,
        name: item.item_status_name,
        code: item.item_status_code,
        date: item.item_status_date,
      },
      metadata: includeItemMetadata ? item.item_metadata : undefined,
      sku: item.sku_id
        ? {
          id: item.sku_id,
          code: item.sku, // from SELECT s.sku
          barcode: item.barcode || null,
        }
        : null,
      packagingMaterial: item.packaging_material_id
        ? {
          id: item.packaging_material_id,
          code: item.packaging_material_code,
          name: formatPackagingMaterialLabel(
            {
              name:      item.packaging_material_name,
              size:      item.packaging_material_size,
              color:     item.packaging_material_color,
              unit:      item.packaging_material_unit,
              // only works if you selected these in SQL (see optional aliases above)
              length_cm: item.packaging_material_length_cm,
              width_cm:  item.packaging_material_width_cm,
              height_cm: item.packaging_material_height_cm,
            },
            {
              fallbackToDimensions: true,   // derive size like "10×20×30 cm" if size is missing
              normalizeUnits: true,         // normalize "pcs/pieces/piece" -> "pc"
            }
          ),
        }
        : null,
      audit: compactAudit(itemAudit, { keepIds: true, nameOnly: true }),
    };
    
    // Only add displayName for SKU lines and only if it’s non-empty
    if (includeItemDisplayName && item.sku_id) {
      // getProductDisplayName expects a single row-like object
      const dn = getProductDisplayName({
        brand: item.brand,
        sku: item.sku,
        country_code: item.country_code,      // if available
        product_name: item.product_name,
        size_label: item.size_label,          // if available
      });
      if (dn) base.displayName = dn; // don't set if falsy -> property omitted
    }
    
    return base;
  });
  
  // Enhance metadata.override_summary.overrides with SKU display data
  if (includeOrderMetadata && orderRow.sales_order_metadata?.price_override_summary?.overrides) {
    const overrides = orderRow.sales_order_metadata.price_override_summary.overrides;
    
    for (const o of overrides) {
      if (!o.sku_id) continue;
      
      const match = items.find((it) => it?.sku?.id === o.sku_id);
      if (match) {
        o.sku = match.sku?.code ?? null;
        o.productDisplayName = match.displayName ?? null;
        
        // Optional safety check: ensure conflictNote is structured correctly
        if (o.data && o.timestamp) {
          o.conflictNote = {
            data: o.data,
            timestamp: o.timestamp,
          };
        }
      }
    }
  }
  
  const shippingAddress = buildAddress(orderRow, 'shipping_', {
    includeFormatted: includeFormattedAddresses,
    formattedOnly: formattedAddressesOnly,
  });
  
  const billingAddress = buildAddress(orderRow, 'billing_', {
    includeFormatted: includeFormattedAddresses,
    formattedOnly: formattedAddressesOnly,
  });
  
  return {
    id: orderRow.order_id,
    orderNumber: orderRow.order_number,
    orderDate: orderRow.order_date,
    statusDate: orderRow.status_date,
    note: orderRow.note,
    type: {
      id: orderRow.order_type_id,
      name: orderRow.order_type_name,
    },
    status: {
      id: orderRow.order_status_id,
      name: orderRow.order_status_name,
      code: orderRow.order_status_code,
    },
    customer: {
      id: orderRow.customer_id,
      fullName: getFullName(orderRow.customer_firstname, orderRow.customer_lastname),
      email: orderRow.customer_email,
      phone: orderRow.customer_phone,
    },
    payment: {
      status: {
        id: orderRow.payment_status_id,
        name: orderRow.payment_status_name,
        code: orderRow.payment_status_code,
      },
      method: {
        id: orderRow.payment_method_id,
        name: orderRow.payment_method_name,
      },
      currencyCode: orderRow.currency_code,
      exchangeRate: orderRow.exchange_rate,
      baseCurrencyAmount: orderRow.base_currency_amount,
    },
    discount: orderRow.discount_id
      ? {
        id: orderRow.discount_id,
        name: orderRow.discount_name,
        label: formatDiscount(orderRow.discount_type, orderRow.discount_value),
        amount: orderRow.discount_amount,
      }
      : null,
    subtotal: orderRow.subtotal,
    tax: orderRow.tax_rate_id
      ? {
        id: orderRow.tax_rate_id,
        name: formatTaxRateLabel({
          name: orderRow.tax_rate_name,
          rate: orderRow.tax_rate_percent,
          province: orderRow.tax_rate_province,
          region: orderRow.tax_rate_region,
        }),
        amount: orderRow.tax_amount,
      }
      : null,
    shippingFee: orderRow.shipping_fee,
    totalAmount: orderRow.total_amount,
    deliveryMethod: {
      id: orderRow.delivery_method_id,
      name: orderRow.delivery_method_name,
    },
    metadata: includeOrderMetadata ? orderRow.sales_order_metadata : undefined,
    shippingAddress,
    billingAddress,
    audit: orderAudit,
    items,
  };
};

/**
 * Converts status-related fields from snake_case to camelCase
 * in enriched order and item objects.
 *
 * Specifically:
 *   - `status_name` → `statusName`
 *   - `status_code` → `statusCode`
 *   - `status_category` → `statusCategory`
 *
 * @param {object} enrichedData - Object containing enriched order and items.
 * @param {object} enrichedData.enrichedOrder - Order object with snake_case keys.
 * @param {object[]} enrichedData.enrichedItems - Array of item objects with snake_case keys.
 * @returns {{ enrichedOrder: object, enrichedItems: object[] }} - Transformed result.
 */
const transformOrderStatusWithMetadata = ({ enrichedOrder, enrichedItems }) => {
  const transformKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const {
      status_name,
      status_code,
      status_category,
      ...rest
    } = obj;
    
    return {
      ...rest,
      statusName: status_name,
      statusCode: status_code,
      statusCategory: status_category,
    };
  };
  
  return {
    enrichedOrder: transformKeys(enrichedOrder),
    enrichedItems: (enrichedItems || []).map(transformKeys),
  };
};

module.exports = {
  transformPaginatedOrderTypes,
  transformOrderWithItems,
  transformOrderStatusWithMetadata,
};
