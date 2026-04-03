/**
 * @file lookup-transformer.js
 * @description Row-level and paginated transformers for all lookup domains.
 *
 * Exports one transformer per lookup domain — each converts raw DB rows into
 * the dropdown-compatible `{ id, label, subLabel?, ...flags }` shape.
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getProductDisplayName }         = require('../utils/display-name-utils');
const { cleanObject }                   = require('../utils/object-utils');
const {
  transformRows,
  transformIdNameToIdLabel,
  includeFlagsBasedOnAccess,
  transformLoadMoreResult,
}                                       = require('../utils/transformer-utils');
const { getFullName }                   = require('../utils/person-utils');
const { formatPackagingMaterialLabel }  = require('../utils/packaging-material-utils');
const { formatAddress }                 = require('../utils/address-utils');
const { formatDiscount }                = require('../utils/discount-utils');
const { formatTaxRateLabel }            = require('../utils/tax-rate-utils');
const {
  createEntityLookupTransformer,
}                                       = require('./common/create-entity-lookup-transformer');
const { STANDARD_FLAG_MAP, STATUS_ONLY_FLAG_MAP } = require('../utils/constants/lookup-flag-maps');

// ---------------------------------------------------------------------------
// Batch registry
// ---------------------------------------------------------------------------

const transformBatchRegistryLookupItem = (row) =>
  cleanObject({
    id:   row.batch_registry_id,
    type: row.batch_type,
    product: row.product_batch_id
      ? {
        id:         row.product_batch_id,
        name:       getProductDisplayName(row),
        lotNumber:  row.product_lot_number,
        expiryDate: row.product_expiry_date,
      }
      : null,
    packagingMaterial: row.packaging_material_batch_id
      ? {
        id:            row.packaging_material_batch_id,
        lotNumber:     row.material_lot_number,
        expiryDate:    row.material_expiry_date,
        snapshotName:  row.material_snapshot_name,
        receivedLabel: row.received_label_name,
      }
      : null,
  });

const transformBatchRegistryPaginatedLookupResult = (paginatedResult) =>
  transformLoadMoreResult(paginatedResult, transformBatchRegistryLookupItem);

// ---------------------------------------------------------------------------
// Warehouse
// ---------------------------------------------------------------------------

const transformWarehouseLookupRows = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map((row) => ({
    value:    row.warehouse_id,
    label:    `${row.warehouse_name} (${row.location_name}${row.warehouse_type_name ? ' - ' + row.warehouse_type_name : ''})`,
    metadata: { locationId: row.location_id },
  }));
};

// ---------------------------------------------------------------------------
// Lot adjustment
// ---------------------------------------------------------------------------

const transformLotAdjustmentLookupOptions = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map((row) => ({
    value:        row.lot_adjustment_type_id,
    label:        row.name,
    actionTypeId: row.inventory_action_type_id,
  }));
};

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

const transformCustomerLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') {
    throw new Error('Invalid customer lookup row.');
  }
  
  const fullName  = getFullName(row.firstname, row.lastname);
  const email     = row.email || 'no-email';
  const base      = transformIdNameToIdLabel({ id: row.id, name: `${fullName} (${email})` });
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP);
  
  return {
    ...base,
    hasAddress: row?.has_address === true,
    ...flagSubset,
  };
};

const transformCustomerPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformCustomerLookup(row, userAccess)
  );

const transformCustomerAddressLookupRow = (row) =>
  cleanObject({
    id:                row.id,
    recipient_name:    row.recipient_name,
    label:             row.label ?? null,
    formatted_address: formatAddress(row),
  });

const transformCustomerAddressesLookupResult = (rows) =>
  transformRows(rows, transformCustomerAddressLookupRow);

// ---------------------------------------------------------------------------
// Order type
// ---------------------------------------------------------------------------

const transformOrderTypeLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const label      = userAccess?.canViewAllCategories
    ? `${row.category} - ${row.name}`
    : row.name;
  const base       = transformIdNameToIdLabel({ id: row.id, name: label });
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP);
  
  return {
    ...base,
    isRequiredPayment: !!row?.requires_payment,
    ...flagSubset,
  };
};

const transformOrderTypeLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformOrderTypeLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Payment method
// ---------------------------------------------------------------------------

const transformPaymentMethodLookup = (row, userAccess) => ({
  ...transformIdNameToIdLabel({ id: row.id, name: row.name }),
  ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
});

const transformPaymentMethodPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformPaymentMethodLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Discount
// ---------------------------------------------------------------------------

const transformDiscountLookup = (row, userAccess) => {
  const formattedValue = formatDiscount(row.discount_type, row.discount_value);
  const base           = transformIdNameToIdLabel({ id: row.id, name: row.name });
  const flagSubset     = includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP);
  
  return {
    ...base,
    label: `${row.name} (${formattedValue})`,
    ...flagSubset,
  };
};

const transformDiscountPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformDiscountLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Tax rate
// ---------------------------------------------------------------------------

const transformTaxRateLookup = (row, userAccess) => ({
  ...transformIdNameToIdLabel({ id: row.id, name: formatTaxRateLabel(row) }),
  ...includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP),
});

const transformTaxRatePaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformTaxRateLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Delivery method
// ---------------------------------------------------------------------------

const transformDeliveryMethodLookup = (row, userAccess) =>
  cleanObject({
    ...transformIdNameToIdLabel({ id: row.id, name: row.name }),
    isPickupLocation: row?.is_pickup_location ?? false,
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  });

const transformDeliveryMethodPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformDeliveryMethodLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// SKU
// ---------------------------------------------------------------------------

/**
 * Flag map for SKU lookups — includes standard flags plus SKU-specific isNormal.
 * Note: isNormal/issueReasons are handled inline below due to conditional nesting.
 *
 * @type {FlagMap}
 */
const SKU_FLAG_MAP = {
  canViewAllStatuses:     'isActive',
  canViewAllValidLookups: 'isValidToday',
  canViewArchived:        'isArchived',
};

const transformSkuLookupRow = (row, { includeBarcode = false } = {}, userAccess) => {
  const productName = getProductDisplayName(row);
  const name        = includeBarcode
    ? `${productName} (${row.sku}) • Barcode: ${row.barcode}`
    : `${productName} (${row.sku})`;
  
  const flags = includeFlagsBasedOnAccess(row, userAccess, SKU_FLAG_MAP);
  
  // isNormal and issueReasons require conditional nesting — handled inline.
  if (userAccess?.allowAllSkus && 'isNormal' in row) {
    flags.isNormal = row.isNormal;
    if (!row.isNormal && Array.isArray(row.issueReasons)) {
      flags.issueReasons = row.issueReasons;
    }
  }
  
  return cleanObject({
    ...transformIdNameToIdLabel({ id: row.id, name }),
    ...flags,
  });
};

const transformSkuPaginatedLookupResult = (paginatedResult, options = {}, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformSkuLookupRow(row, options, userAccess)
  );

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const transformPricingLookupRow = (
  row,
  userAccess,
  {
    showSku          = true,
    showPriceType    = true,
    showPriceInLabel = true,
    labelOnly        = false,
  } = {}
) => {
  const productDisplayName = getProductDisplayName({
    product_name: row.product_name,
    sku:          row.sku,
    brand:        row.brand        ?? '',
    country_code: row.country_code ?? '',
    display_name: row.display_name,
  });
  
  const labelParts = [];
  if (showSku)          labelParts.push(`${productDisplayName} (${row.sku})`);
  if (showPriceType)    labelParts.push(row.price_type);
  if (showPriceInLabel) labelParts.push(`$${row.price}`);
  
  const canViewExtended = userAccess?.canViewAllStatuses || userAccess?.canViewAllValidLookups;
  const base            = { id: row.id, label: labelParts.join(' · ') };
  
  if (!labelOnly) {
    if (canViewExtended && row.location_name) base.locationName = row.location_name;
    base.price           = row.price;
    base.pricingTypeName = row.price_type;
    Object.assign(base, includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP));
  } else if (canViewExtended) {
    Object.assign(base, includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP));
  }
  
  return cleanObject(base);
};

const transformPricingPaginatedLookupResult = (paginatedResult, userAccess, options = {}) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformPricingLookupRow(row, userAccess, options)
  );

// ---------------------------------------------------------------------------
// Packaging material
// ---------------------------------------------------------------------------

const transformPackagingMaterialLookupRow = (row, userAccess) => {
  if (!row || typeof row !== 'object' || !row.id) return null;
  
  const label = formatPackagingMaterialLabel(row);
  if (!label) return null;
  
  const base       = transformIdNameToIdLabel({ id: row.id, name: label });
  const flagSubset = includeFlagsBasedOnAccess(row, userAccess, STANDARD_FLAG_MAP);
  
  const out = { ...base, ...flagSubset };
  
  // isArchived exposed separately — only visible to users with full status access.
  if (userAccess?.canViewAllStatuses) {
    out.isArchived = row?.is_archived === true;
  }
  
  return cleanObject(out);
};

const transformPackagingMaterialPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformPackagingMaterialLookupRow(row, userAccess)
  );

// ---------------------------------------------------------------------------
// SKU code base
// ---------------------------------------------------------------------------

const transformSkuCodeBaseLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const brand    = row.brand_code    || 'N/A';
  const category = row.category_code || 'N/A';
  const base     = row.base_code != null ? row.base_code : '—';
  const label    = `${brand}-${category} (${base})`;
  
  return {
    ...transformIdNameToIdLabel({ id: row.id, name: label }),
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  };
};

const transformSkuCodeBasePaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformSkuCodeBaseLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

const transformProductLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const labelParts = [row.name ?? 'Unnamed Product'];
  if (row.brand)    labelParts.push(`• ${row.brand}`);
  if (row.category) labelParts.push(`(${row.category})`);
  else if (row.series) labelParts.push(`(${row.series})`);
  
  return {
    ...transformIdNameToIdLabel({ id: row.id, name: labelParts.join(' ') }),
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  };
};

const transformProductPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformProductLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

const transformStatusLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const desc  = row.description ? ` - ${row.description}` : '';
  const label = `${row.name || 'Unknown Status'}${desc}`;
  
  return {
    ...transformIdNameToIdLabel({ id: row.id, name: label }),
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  };
};

const transformStatusPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformStatusLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

const transformUserLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  if (!row.id || !row.email)           return null;
  
  const fullName = getFullName(row.firstname, row.lastname);
  const label    = fullName || row.email;
  const subLabel = fullName ? row.email : undefined;
  
  return cleanObject({
    id: row.id,
    label,
    subLabel,
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  });
};

const transformUserPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformUserLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/**
 * Enriches a role row with an `isActive` flag.
 * Exported for use in the service layer before transformation.
 *
 * @param {Object} row
 * @param {string} activeStatusId
 * @returns {Object}
 */
const enrichRoleOption = (row, activeStatusId) => {
  if (!row || typeof row !== 'object') {
    throw new Error('[enrichRoleOption] Invalid `row`');
  }
  if (!activeStatusId || typeof activeStatusId !== 'string') {
    throw new Error('[enrichRoleOption] Invalid `activeStatusId`');
  }
  
  return { ...row, isActive: row.status_id === activeStatusId };
};

const transformRoleLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  
  const labelParts = [row.name ?? 'Unnamed Role'];
  if (row.role_group) labelParts.push(`• ${row.role_group}`);
  
  return {
    ...transformIdNameToIdLabel({ id: row.id, name: labelParts.join(' ') }),
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  };
};

const transformRolePaginatedLookupResult = (paginatedResult, access) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformRoleLookup(row, access)
  );

// ---------------------------------------------------------------------------
// Manufacturer / Supplier / Location type (shared factory)
// ---------------------------------------------------------------------------

const transformManufacturerLookup = createEntityLookupTransformer({
  labelKey:    'name',
  subLabelKey: 'contact_name',
});

const transformManufacturerPaginatedLookupResult = (paginatedResult, acl) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformManufacturerLookup(row, acl)
  );

const transformSupplierLookup = createEntityLookupTransformer({
  labelKey:    'name',
  subLabelKey: 'contact_name',
});

const transformSupplierPaginatedLookupResult = (paginatedResult, acl) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformSupplierLookup(row, acl)
  );

const transformLocationTypeLookup = createEntityLookupTransformer({
  labelKey: 'name',
});

const transformLocationTypePaginatedLookupResult = (paginatedResult, acl) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformLocationTypeLookup(row, acl)
  );

// ---------------------------------------------------------------------------
// Batch status
// ---------------------------------------------------------------------------

const transformBatchStatusLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  if (!row.id || !row.name)            return null;
  
  return cleanObject({
    id:       row.id,
    label:    row.name,
    subLabel: row.description || undefined,
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  });
};

const transformBatchStatusPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformBatchStatusLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------
// Packaging material supplier
// ---------------------------------------------------------------------------

const transformPackagingMaterialSupplierLookup = (row, userAccess) => {
  if (!row || typeof row !== 'object') return null;
  if (!row.id || !row.name)            return null;
  
  const subLabelParts = [row.contact_name, row.contact_email].filter(Boolean);
  
  return cleanObject({
    id:          row.id,
    label:       row.name,
    subLabel:    subLabelParts.length ? subLabelParts.join(' • ') : undefined,
    isPreferred: row.is_preferred ?? false,
    ...includeFlagsBasedOnAccess(row, userAccess, STATUS_ONLY_FLAG_MAP),
  });
};

const transformPackagingMaterialSupplierPaginatedLookupResult = (paginatedResult, userAccess) =>
  transformLoadMoreResult(paginatedResult, (row) =>
    transformPackagingMaterialSupplierLookup(row, userAccess)
  );

// ---------------------------------------------------------------------------

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
  transformSkuCodeBasePaginatedLookupResult,
  transformProductPaginatedLookupResult,
  transformStatusPaginatedLookupResult,
  transformUserPaginatedLookupResult,
  enrichRoleOption,
  transformRolePaginatedLookupResult,
  transformManufacturerPaginatedLookupResult,
  transformSupplierPaginatedLookupResult,
  transformLocationTypePaginatedLookupResult,
  transformBatchStatusPaginatedLookupResult,
  transformPackagingMaterialSupplierPaginatedLookupResult,
};
