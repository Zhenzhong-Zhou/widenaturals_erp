/**
 * @file order-transformer.js
 * @description Row-level and composite transformers for order records.
 *
 * Exports:
 *   - transformPaginatedOrderTypes        – transforms paginated order rows for table view
 *   - transformOrderWithItems             – transforms a full order detail with line items
 *   - transformOrderStatusWithMetadata    – normalises status metadata keys to camelCase
 *
 * Internal helpers (not exported):
 *   - transformOrderRow – per-row transformer for paginated results
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject }                   = require('../utils/object-utils');
const { getFullName }                   = require('../utils/person-utils');
const { makeAudit, compactAudit }       = require('../utils/audit-utils');
const { formatPackagingMaterialLabel }  = require('../utils/packaging-material-utils');
const { formatDiscount }                = require('../utils/discount-utils');
const { formatTaxRateLabel }            = require('../utils/tax-rate-utils');
const { getProductDisplayName }         = require('../utils/display-name-utils');
const { buildAddress }                  = require('../utils/address-utils');
const { transformPageResult }           = require('../utils/transformer-utils');

/**
 * Transforms a single paginated order DB row into the table view shape.
 *
 * @param {OrderRow} row
 * @returns {OrderRecord|null}
 */
const transformOrderRow = (row) => {
  if (!row) return null;
  
  return cleanObject({
    id:          row.id,
    orderNumber: row.order_number,
    orderType:   row.order_type || null,
    orderStatus: {
      code: row.order_status_code,
      name: row.order_status_name,
    },
    orderDate:     row.order_date,
    statusDate:    row.status_date,
    createdAt:     row.created_at,
    createdBy:     getFullName(row.created_by_firstname, row.created_by_lastname),
    updatedAt:     row.updated_at,
    updatedBy:     getFullName(row.updated_by_firstname, row.updated_by_lastname),
    note:          row.note          ?? null,
    customerName:  getFullName(row.customer_firstname, row.customer_lastname),
    paymentMethod: row.payment_method || null,
    paymentStatus: {
      name: row.payment_status_name || null,
      code: row.payment_status_code || null,
    },
    deliveryMethod: row.delivery_method || null,
    numberOfItems:  row.number_of_items ?? 0,
  });
};

/**
 * Transforms a paginated order result set into the table view shape.
 *
 * @param {Object}      paginatedResult
 * @param {OrderRow[]}  paginatedResult.data
 * @param {Object}      paginatedResult.pagination
 * @returns {Promise<PaginatedResult<OrderRow>>}
 */
const transformPaginatedOrderTypes = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<OrderRow>>} */
  (transformPageResult(paginatedResult, transformOrderRow));

/**
 * Transforms a full order detail header and line items into the detail response shape.
 *
 * Supports optional inclusion of order/item metadata, formatted addresses,
 * and SKU display names — controlled via the options object.
 *
 * @param {OrderDetailRow}   orderRow
 * @param {OrderItemRow[]}   orderItemRows
 * @param {Object}           [options]
 * @param {boolean}          [options.includeOrderMetadata=false]
 * @param {boolean}          [options.includeItemMetadata=false]
 * @param {boolean}          [options.dedupeAudit=true]
 * @param {boolean}          [options.includeFormattedAddresses=true]
 * @param {boolean}          [options.formattedAddressesOnly=true]
 * @param {boolean}          [options.includeItemDisplayName=true]
 * @returns {Object|null}
 */
const transformOrderWithItems = (
  orderRow,
  orderItemRows,
  {
    includeOrderMetadata      = false,
    includeItemMetadata       = false,
    dedupeAudit               = true,
    includeFormattedAddresses = true,
    formattedAddressesOnly    = true,
    includeItemDisplayName    = true,
  } = {}
) => {
  if (!orderRow) return null;
  
  // Build order-level audit from prefixed fields.
  const orderAudit = compactAudit(
    makeAudit(
      {
        order_created_at:             orderRow.order_created_at,
        order_created_by:             orderRow.order_created_by,
        order_created_by_firstname:   orderRow.order_created_by_firstname,
        order_created_by_lastname:    orderRow.order_created_by_lastname,
        order_updated_at:             orderRow.order_updated_at,
        order_updated_by:             orderRow.order_updated_by,
        order_updated_by_firstname:   orderRow.order_updated_by_firstname,
        order_updated_by_lastname:    orderRow.order_updated_by_lastname,
      },
      { dedupe: dedupeAudit, prefix: 'order_', includeIds: true, includeFullName: true }
    ),
    { keepIds: true, nameOnly: true }
  );
  
  const items = (orderItemRows || []).map((item) => {
    const itemAudit = makeAudit(
      {
        item_created_at:            item.item_created_at,
        item_created_by:            item.item_created_by,
        item_created_by_firstname:  item.item_created_by_firstname,
        item_created_by_lastname:   item.item_created_by_lastname,
        item_updated_at:            item.item_updated_at,
        item_updated_by:            item.item_updated_by,
        item_updated_by_firstname:  item.item_updated_by_firstname,
        item_updated_by_lastname:   item.item_updated_by_lastname,
      },
      { dedupe: dedupeAudit, prefix: 'item_' }
    );
    
    const base = {
      id:             item.order_item_id,
      orderId:        item.order_id,
      quantityOrdered: item.quantity_ordered,
      priceId:        item.price_id,
      listedPrice:    item.listed_price,
      priceTypeName:  item.price_type_name,
      price:          item.item_price,
      subtotal:       item.item_subtotal,
      status: {
        id:   item.item_status_id,
        name: item.item_status_name,
        code: item.item_status_code,
        date: item.item_status_date,
      },
      metadata: includeItemMetadata ? item.item_metadata : undefined,
      sku: item.sku_id
        ? {
          id:      item.sku_id,
          code:    item.sku,
          barcode: item.barcode || null,
        }
        : null,
      packagingMaterial: item.packaging_material_id
        ? {
          id:   item.packaging_material_id,
          code: item.packaging_material_code,
          name: formatPackagingMaterialLabel(
            {
              name:      item.packaging_material_name,
              size:      item.packaging_material_size,
              color:     item.packaging_material_color,
              unit:      item.packaging_material_unit,
              length_cm: item.packaging_material_length_cm,
              width_cm:  item.packaging_material_width_cm,
              height_cm: item.packaging_material_height_cm,
            },
            { fallbackToDimensions: true, normalizeUnits: true }
          ),
        }
        : null,
      audit: compactAudit(itemAudit, { keepIds: true, nameOnly: true }),
    };
    
    // Add display name for SKU lines only when non-empty.
    if (includeItemDisplayName && item.sku_id) {
      const dn = getProductDisplayName({
        brand:        item.brand,
        sku:          item.sku,
        country_code: item.country_code,
        product_name: item.product_name,
        size_label:   item.size_label,
      });
      if (dn) base.displayName = dn;
    }
    
    return base;
  });
  
  // Enrich price override metadata with SKU display data when available.
  if (
    includeOrderMetadata &&
    orderRow.sales_order_metadata?.price_override_summary?.overrides
  ) {
    for (const o of orderRow.sales_order_metadata.price_override_summary.overrides) {
      if (!o.sku_id) continue;
      
      const match = items.find((it) => it?.sku?.id === o.sku_id);
      if (match) {
        o.sku                = match.sku?.code          ?? null;
        o.productDisplayName = match.displayName         ?? null;
        
        if (o.data && o.timestamp) {
          o.conflictNote = { data: o.data, timestamp: o.timestamp };
        }
      }
    }
  }
  
  const shippingAddress = buildAddress(orderRow, 'shipping_', {
    includeFormatted: includeFormattedAddresses,
    formattedOnly:    formattedAddressesOnly,
  });
  
  const billingAddress = buildAddress(orderRow, 'billing_', {
    includeFormatted: includeFormattedAddresses,
    formattedOnly:    formattedAddressesOnly,
  });
  
  return {
    id:          orderRow.order_id,
    orderNumber: orderRow.order_number,
    orderDate:   orderRow.order_date,
    statusDate:  orderRow.status_date,
    note:        orderRow.note,
    type: {
      id:   orderRow.order_type_id,
      name: orderRow.order_type_name,
    },
    status: {
      id:   orderRow.order_status_id,
      name: orderRow.order_status_name,
      code: orderRow.order_status_code,
    },
    customer: {
      id:       orderRow.customer_id,
      fullName: getFullName(orderRow.customer_firstname, orderRow.customer_lastname),
      email:    orderRow.customer_email,
      phone:    orderRow.customer_phone,
    },
    payment: {
      status: {
        id:   orderRow.payment_status_id,
        name: orderRow.payment_status_name,
        code: orderRow.payment_status_code,
      },
      method: {
        id:   orderRow.payment_method_id,
        name: orderRow.payment_method_name,
      },
      currencyCode:       orderRow.currency_code,
      exchangeRate:       orderRow.exchange_rate,
      baseCurrencyAmount: orderRow.base_currency_amount,
    },
    discount: orderRow.discount_id
      ? {
        id:     orderRow.discount_id,
        name:   orderRow.discount_name,
        label:  formatDiscount(orderRow.discount_type, orderRow.discount_value),
        amount: orderRow.discount_amount,
      }
      : null,
    subtotal: orderRow.subtotal,
    tax: orderRow.tax_rate_id
      ? {
        id:   orderRow.tax_rate_id,
        name: formatTaxRateLabel({
          name:     orderRow.tax_rate_name,
          rate:     orderRow.tax_rate_percent,
          province: orderRow.tax_rate_province,
          region:   orderRow.tax_rate_region,
        }),
        amount: orderRow.tax_amount,
      }
      : null,
    shippingFee:    orderRow.shipping_fee,
    totalAmount:    orderRow.total_amount,
    deliveryMethod: {
      id:   orderRow.delivery_method_id,
      name: orderRow.delivery_method_name,
    },
    metadata:        includeOrderMetadata ? orderRow.sales_order_metadata : undefined,
    shippingAddress,
    billingAddress,
    audit: orderAudit,
    items,
  };
};

/**
 * Normalises order status metadata keys from snake_case to camelCase.
 *
 * Converts `status_name`, `status_code`, `status_category` on both the
 * enriched order and each enriched item.
 *
 * @param {Object}   params
 * @param {Object}   params.enrichedOrder
 * @param {Object[]} params.enrichedItems
 * @returns {{ enrichedOrder: Object, enrichedItems: Object[] }}
 */
const transformOrderStatusWithMetadata = ({ enrichedOrder, enrichedItems }) => {
  const normaliseStatusKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const { status_name, status_code, status_category, ...rest } = obj;
    
    return {
      ...rest,
      statusName:     status_name,
      statusCode:     status_code,
      statusCategory: status_category,
    };
  };
  
  return {
    enrichedOrder: normaliseStatusKeys(enrichedOrder),
    enrichedItems: (enrichedItems || []).map(normaliseStatusKeys),
  };
};

module.exports = {
  transformPaginatedOrderTypes,
  transformOrderWithItems,
  transformOrderStatusWithMetadata,
};
