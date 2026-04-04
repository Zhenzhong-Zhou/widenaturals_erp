/**
 * @file lookup-service.js
 * @description Business logic for all lookup domain operations.
 *
 * Exports one service function per lookup domain. Each function evaluates
 * access control, applies visibility rules, queries the repository, enriches
 * rows, and transforms the result for UI consumption.
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const AppError                             = require('../utils/AppError');
const { getBatchRegistryLookup }           = require('../repositories/batch-registry-repository');
const { getWarehouseLookup }               = require('../repositories/warehouse-repository');
const {
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
}                                          = require('../transformers/lookup-transformer');
const { getLotAdjustmentTypeLookup }       = require('../repositories/lot-adjustment-type-repository');
const { getCustomerLookup }                = require('../repositories/customer-repository');
const {
  evaluateCustomerLookupAccessControl,
  enforceCustomerLookupVisibilityRules,
  enrichCustomerOption,
}                                          = require('../business/customer-business');
const {
  getCustomerAddressLookupById,
  hasAssignedAddresses,
}                                          = require('../repositories/address-repository');
const LOOKUPS                              = require('../utils/constants/domain/lookup-constants');
const { resolveWarehouseFiltersByPermission } = require('../business/warehouse-business');
const { enforceExternalAccessPermission }  = require('../business/lot-adjustment-type-business');
const { getOrderTypeLookup }               = require('../repositories/order-type-repository');
const {
  evaluateOrderTypeLookupAccessControl,
  enforceOrderTypeLookupVisibilityRules,
  enrichOrderTypeRow,
}                                          = require('../business/order-type-business');
const {
  evaluatePaymentMethodLookupAccessControl,
  enforcePaymentMethodLookupVisibilityRules,
  enrichPaymentMethodOption,
}                                          = require('../business/payment-method-business');
const { getPaymentMethodLookup }           = require('../repositories/payment-method-repository');
const { getDiscountsLookup }               = require('../repositories/discount-repository');
const {
  evaluateDiscountLookupAccessControl,
  filterDiscountLookupQuery,
  enforceDiscountLookupVisibilityRules,
  enrichDiscountRow,
}                                          = require('../business/discount-business');
const { getStatusId }                      = require('../config/status-cache');
const {
  evaluateTaxRateLookupAccessControl,
  enforceTaxRateLookupVisibilityRules,
  filterTaxRateLookupQuery,
  enrichTaxRateRow,
}                                          = require('../business/tax-rate-business');
const { getTaxRatesLookup }                = require('../repositories/tax-rate-repository');
const {
  evaluateDeliveryMethodLookupAccessControl,
  enforceDeliveryMethodLookupVisibilityRules,
  enrichDeliveryMethodRow,
}                                          = require('../business/delivery-method-business');
const { getDeliveryMethodsLookup }         = require('../repositories/delivery-method-repository');
const {
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery,
  enrichSkuRow,
}                                          = require('../business/sku-business');
const { getSkuLookup }                     = require('../repositories/sku-repository');
const {
  evaluatePricingLookupAccessControl,
  enforcePricingLookupVisibilityRules,
  filterPricingLookupQuery,
  enrichPricingRow,
}                                          = require('../business/pricing-business');
const { getPricingLookup }                 = require('../repositories/pricing-repository');
const {
  evaluatePackagingMaterialLookupAccessControl,
  enforcePackagingMaterialVisibilityRules,
  enrichPackagingMaterialOption,
}                                          = require('../business/packaging-material-business');
const {
  getPackagingMaterialsForSalesOrderLookup,
}                                          = require('../repositories/packaging-material-repository');
const {
  evaluateSkuCodeBaseLookupAccessControl,
  enforceSkuCodeBaseLookupVisibilityRules,
  enrichSkuCodeBaseOption,
}                                          = require('../business/sku-code-base-business');
const { getSkuCodeBaseLookup }             = require('../repositories/sku-code-base-repository');
const {
  evaluateProductLookupAccessControl,
  enforceProductLookupVisibilityRules,
  enrichProductOption,
}                                          = require('../business/product-business');
const { getProductLookup }                 = require('../repositories/product-repository');
const {
  evaluateStatusLookupAccessControl,
  enforceStatusLookupVisibilityRules,
  enrichStatusLookupOption,
}                                          = require('../business/status-business');
const { getStatusLookup }                  = require('../repositories/status-repository');
const {
  evaluateUserVisibilityAccessControl,
  applyUserLookupVisibilityRules,
  enrichUserLookupWithActiveFlag,
  evaluateUserLookupSearchCapabilities,
}                                          = require('../business/user-business');
const { getUserLookup }                    = require('../repositories/user-repository');
const { getRoleLookup }                    = require('../repositories/role-repository');
const {
  evaluateRoleVisibilityAccessControl,
  applyRoleVisibilityRules,
}                                          = require('../business/role-business');
const {
  evaluateManufacturerVisibilityAccessControl,
  evaluateManufacturerLookupSearchCapabilities,
  enrichManufacturerLookupWithActiveFlag,
}                                          = require('../business/manufacturer-business');
const { applyLookupVisibilityRules }       = require('../business/lookup-visibility');
const { getManufacturerLookup }            = require('../repositories/manufacturer-repository');
const {
  evaluateSupplierVisibilityAccessControl,
  evaluateSupplierLookupSearchCapabilities,
  enrichSupplierLookupWithActiveFlag,
}                                          = require('../business/supplier-business');
const { getSupplierLookup }                = require('../repositories/supplier-repository');
const {
  evaluateLocationTypeVisibilityAccessControl,
  evaluateLocationTypeLookupSearchCapabilities,
  enrichLocationTypeLookupWithActiveFlag,
}                                          = require('../business/location-type-business');
const { getLocationTypeLookup }            = require('../repositories/location-type-repository');
const {
  evaluateBatchStatusVisibilityAccessControl,
  applyBatchStatusLookupVisibilityRules,
  enrichBatchStatusLookupWithActiveFlag,
}                                          = require('../business/batch-status-business');
const { getBatchStatusLookup }             = require('../repositories/batch-status-repository');
const { executeLookupWorkflow }            = require('../utils/lookup-workflow');
const {
  getPackagingMaterialSupplierLookup,
}                                          = require('../repositories/packaging-material-supplier-repository');
const {
  evaluatePackagingMaterialSupplierLookupAccessControl,
  enforcePackagingMaterialSupplierLookupVisibilityRules,
  enrichPackagingMaterialSupplierLookupWithActiveFlag,
}                                          = require('../business/packaging-material-supplier-business');

const CONTEXT = 'lookup-service';

// ---------------------------------------------------------------------------

const fetchBatchRegistryLookupService = async ({ filters = {}, limit, offset = 0 }) => {
  const context = `${CONTEXT}/fetchBatchRegistryLookupService`;
  
  try {
    const rawResult = await getBatchRegistryLookup({ filters, limit, offset });
    return transformBatchRegistryPaginatedLookupResult(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch batch registry lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchWarehouseLookupService = async (user, { filters = {} } = {}) => {
  const context = `${CONTEXT}/fetchWarehouseLookupService`;
  
  try {
    const resolvedFilters = await resolveWarehouseFiltersByPermission(user, filters);
    const rows            = await getWarehouseLookup({ filters: resolvedFilters });
    
    return {
      items:   transformWarehouseLookupRows(rows),
      hasMore: false, // warehouses are bounded — full list always returned
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch warehouse lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchLotAdjustmentLookupService = async (user, filters = {}) => {
  const context = `${CONTEXT}/fetchLotAdjustmentLookupService`;
  
  try {
    const includeExternal = !!filters.includeExternal;
    await enforceExternalAccessPermission(user, includeExternal);
    
    const rows = await getLotAdjustmentTypeLookup(filters);
    
    return {
      items:   transformLotAdjustmentLookupOptions(rows),
      hasMore: false,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch lot adjustment lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchCustomerLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchCustomerLookupService`;
  
  try {
    const userAccess     = await evaluateCustomerLookupAccessControl(user);
    const activeStatusId = getStatusId('customer_active');
    
    const adjustedFilters = enforceCustomerLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getCustomerLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichCustomerOption(row, activeStatusId));
    
    return transformCustomerPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch customer lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchCustomerAddressLookupService = async (customerId) => {
  const context = `${CONTEXT}/fetchCustomerAddressLookupService`;
  
  try {
    const hasAddresses      = await hasAssignedAddresses(customerId);
    const includeUnassigned = !hasAddresses;
    
    const rawRows = await getCustomerAddressLookupById({
      filters: { customerId },
      includeUnassigned,
    });
    
    if (rawRows.length > LOOKUPS.ADDRESSES.MAX_BY_CUSTOMER) {
      throw AppError.validationError('Customer has too many addresses — possible data issue.');
    }
    
    return {
      items:   transformCustomerAddressesLookupResult(rawRows),
      hasMore: false,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch customer address lookup data.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchOrderTypeLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchOrderTypeLookupService`;
  
  try {
    const userAccess     = await evaluateOrderTypeLookupAccessControl(user, { action: 'VIEW' });
    const activeStatusId = getStatusId('order_type_active');
    
    const enforcedFilters = enforceOrderTypeLookupVisibilityRules(filters, userAccess, { activeStatusId });
    
    const rawResult    = await getOrderTypeLookup({ filters: enforcedFilters, limit, offset });
    const enrichedRows = rawResult.data.map((row) => enrichOrderTypeRow(row, activeStatusId));
    
    return transformOrderTypeLookupResult(
      { data: enrichedRows, pagination: rawResult.pagination },
      userAccess
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch order type lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedPaymentMethodLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchPaginatedPaymentMethodLookupService`;
  
  try {
    const userAccess      = await evaluatePaymentMethodLookupAccessControl(user);
    const adjustedFilters = enforcePaymentMethodLookupVisibilityRules(filters, userAccess);
    
    const { data = [], pagination = {} } = await getPaymentMethodLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map(enrichPaymentMethodOption);
    
    return transformPaymentMethodPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch payment method lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedDiscountLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchPaginatedDiscountLookupService`;
  
  try {
    const userAccess     = await evaluateDiscountLookupAccessControl(user);
    const activeStatusId = getStatusId('discount_active');
    
    const permissionFilters = enforceDiscountLookupVisibilityRules(filters, userAccess, activeStatusId);
    const finalFilters      = filterDiscountLookupQuery(permissionFilters, userAccess);
    
    const { data = [], pagination = {} } = await getDiscountsLookup({
      filters: finalFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichDiscountRow(row, activeStatusId));
    
    return transformDiscountPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch discount lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedTaxRateLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchPaginatedTaxRateLookupService`;
  
  try {
    const userAccess        = await evaluateTaxRateLookupAccessControl(user);
    const permissionFilters = enforceTaxRateLookupVisibilityRules(filters, userAccess);
    const finalFilters      = filterTaxRateLookupQuery(permissionFilters, userAccess);
    
    const { data = [], pagination = {} } = await getTaxRatesLookup({
      filters: finalFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map(enrichTaxRateRow);
    
    return transformTaxRatePaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch tax rate lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedDeliveryMethodLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchPaginatedDeliveryMethodLookupService`;
  
  try {
    const userAccess      = await evaluateDeliveryMethodLookupAccessControl(user);
    const activeStatusId  = getStatusId('delivery_method_active');
    const adjustedFilters = enforceDeliveryMethodLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getDeliveryMethodsLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichDeliveryMethodRow(row, activeStatusId));
    
    return transformDeliveryMethodPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch delivery method lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedSkuLookupService = async (
  user,
  { filters = {}, options = {}, limit = 50, offset = 0 }
) => {
  const context = `${CONTEXT}/fetchPaginatedSkuLookupService`;
  
  try {
    const { includeBarcode = false } = options || {};
    
    const activeStatusId    = getStatusId('product_active');
    const inventoryStatusId = getStatusId('inventory_in_stock');
    const batchStatusId     = getStatusId('batch_released');
    
    const userAccess      = await evaluateSkuFilterAccessControl(user);
    const enforcedOptions = enforceSkuLookupVisibilityRules(options, userAccess);
    
    if (!enforcedOptions.allowAllSkus && !activeStatusId) {
      throw AppError.validationError('activeStatusId is required when allowAllSkus is false.');
    }
    
    const queryFilters = filterSkuLookupQuery(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getSkuLookup({
      productStatusId: activeStatusId,
      filters:         queryFilters,
      options:         enforcedOptions,
      limit,
      offset,
    });
    
    const expectedStatusIds = {
      sku:       activeStatusId,
      product:   activeStatusId,
      warehouse: inventoryStatusId,
      location:  inventoryStatusId,
      batch:     batchStatusId,
    };
    
    const enrichedRows = data.map((row) => enrichSkuRow(row, expectedStatusIds));
    
    return transformSkuPaginatedLookupResult(
      { data: enrichedRows, pagination },
      { includeBarcode },
      userAccess
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedPricingLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0, displayOptions = {} }
) => {
  const context = `${CONTEXT}/fetchPaginatedPricingLookupService`;
  
  try {
    const activeStatusId  = getStatusId('pricing_active');
    const userAccess      = await evaluatePricingLookupAccessControl(user);
    const adjustedFilters = enforcePricingLookupVisibilityRules(filters, userAccess, activeStatusId);
    const queryFilters    = filterPricingLookupQuery(adjustedFilters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getPricingLookup({
      filters: queryFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichPricingRow(row, activeStatusId));
    
    return transformPricingPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess,
      displayOptions
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch pricing lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchPaginatedPackagingMaterialLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0, mode = 'generic' } = {}
) => {
  const context = `${CONTEXT}/fetchPaginatedPackagingMaterialLookupService`;
  
  try {
    const isSales        = mode === 'salesDropdown';
    const userAccess     = await evaluatePackagingMaterialLookupAccessControl(user);
    const activeStatusId = getStatusId('packaging_material_active');
    
    let adjusted          = enforcePackagingMaterialVisibilityRules(filters, userAccess, activeStatusId);
    adjusted.visibleOnly  = isSales;
    
    if (isSales) {
      adjusted = {
        ...adjusted,
        restrictToUnarchived: true,
        _activeStatusId:      activeStatusId,
      };
      delete adjusted.statusId;
    }
    
    const { data = [], pagination = {} } = await getPackagingMaterialsForSalesOrderLookup({
      filters: adjusted,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichPackagingMaterialOption(row, activeStatusId));
    
    return transformPackagingMaterialPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch packaging material lookup options.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchSkuCodeBaseLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchSkuCodeBaseLookupService`;
  
  try {
    const userAccess      = await evaluateSkuCodeBaseLookupAccessControl(user);
    const activeStatusId  = getStatusId('general_active');
    const adjustedFilters = enforceSkuCodeBaseLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getSkuCodeBaseLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichSkuCodeBaseOption(row, activeStatusId));
    
    return transformSkuCodeBasePaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch SKU code base lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchProductLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchProductLookupService`;
  
  try {
    const userAccess      = await evaluateProductLookupAccessControl(user);
    const activeStatusId  = getStatusId('general_active');
    const adjustedFilters = enforceProductLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getProductLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichProductOption(row, activeStatusId));
    
    return transformProductPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch product lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchStatusLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchStatusLookupService`;
  
  try {
    const userAccess      = await evaluateStatusLookupAccessControl(user);
    const adjustedFilters = enforceStatusLookupVisibilityRules(filters, userAccess);
    
    const { data = [], pagination = {} } = await getStatusLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichStatusLookupOption(row));
    
    return transformStatusPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch status lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchUserLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchUserLookupService`;
  
  try {
    const userAccess         = await evaluateUserVisibilityAccessControl(user);
    const activeStatusId     = getStatusId('general_active');
    const searchCapabilities = await evaluateUserLookupSearchCapabilities(user);
    const adjustedFilters    = applyUserLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getUserLookup({
      filters:  adjustedFilters,
      options:  searchCapabilities,
      limit,
      offset,
    });
    
    // Enrich with isActive flag only when inactive users may be visible.
    const enrichedRows = userAccess.canViewAllStatuses
      ? data.map((row) => enrichUserLookupWithActiveFlag(row, activeStatusId))
      : data;
    
    return transformUserPaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch user lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchRoleLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchRoleLookupService`;
  
  try {
    const userAccess      = await evaluateRoleVisibilityAccessControl(user);
    const activeStatusId  = getStatusId('general_active');
    const adjustedFilters = applyRoleVisibilityRules(filters, userAccess, activeStatusId);
    
    const { data = [], pagination = {} } = await getRoleLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    const enrichedRows = data.map((row) => enrichRoleOption(row, activeStatusId));
    
    return transformRolePaginatedLookupResult({ data: enrichedRows, pagination }, userAccess);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch role lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchManufacturerLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchManufacturerLookupService`;
  
  try {
    const acl                = await evaluateManufacturerVisibilityAccessControl(user);
    const activeStatusId     = getStatusId('general_active');
    const searchCapabilities = await evaluateManufacturerLookupSearchCapabilities(user);
    const adjustedFilters    = applyLookupVisibilityRules({
      filters,
      acl,
      activeStatusId,
      fullVisibilityKey: 'canViewAllManufacturers',
    });
    
    const { data = [], pagination = {} } = await getManufacturerLookup({
      filters: adjustedFilters,
      options: searchCapabilities,
      limit,
      offset,
    });
    
    const enrichedRows = acl.enforceActiveOnly
      ? data
      : data.map((row) => enrichManufacturerLookupWithActiveFlag(row, activeStatusId));
    
    return transformManufacturerPaginatedLookupResult({ data: enrichedRows, pagination }, acl);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch manufacturer lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchSupplierLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchSupplierLookupService`;
  
  try {
    const acl                = await evaluateSupplierVisibilityAccessControl(user);
    const activeStatusId     = getStatusId('general_active');
    const searchCapabilities = await evaluateSupplierLookupSearchCapabilities(user);
    const adjustedFilters    = applyLookupVisibilityRules({
      filters,
      acl,
      activeStatusId,
      fullVisibilityKey: 'canViewAllSuppliers',
    });
    
    const { data = [], pagination = {} } = await getSupplierLookup({
      filters: adjustedFilters,
      options: searchCapabilities,
      limit,
      offset,
    });
    
    const enrichedRows = acl.enforceActiveOnly
      ? data
      : data.map((row) => enrichSupplierLookupWithActiveFlag(row, activeStatusId));
    
    return transformSupplierPaginatedLookupResult({ data: enrichedRows, pagination }, acl);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch supplier lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchLocationTypeLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/fetchLocationTypeLookupService`;
  
  try {
    const acl                = await evaluateLocationTypeVisibilityAccessControl(user);
    const activeStatusId     = getStatusId('general_active');
    const searchCapabilities = await evaluateLocationTypeLookupSearchCapabilities(user);
    const adjustedFilters    = applyLookupVisibilityRules({
      filters,
      acl,
      activeStatusId,
      fullVisibilityKey: 'canViewAllLocationTypes',
    });
    
    const { data = [], pagination = {} } = await getLocationTypeLookup({
      filters: adjustedFilters,
      options: searchCapabilities,
      limit,
      offset,
    });
    
    const enrichedRows = acl.enforceActiveOnly
      ? data
      : data.map((row) => enrichLocationTypeLookupWithActiveFlag(row, activeStatusId));
    
    return transformLocationTypePaginatedLookupResult({ data: enrichedRows, pagination }, acl);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch location type lookup list.', {
      meta: { error: error.message, context },
    });
  }
};

// ---------------------------------------------------------------------------

const fetchBatchStatusLookupService = async (user, { filters = {}, limit = 50, offset = 0 }) => {
  return executeLookupWorkflow({
    user,
    filters,
    limit,
    offset,
    repository:         getBatchStatusLookup,
    aclEvaluator:       evaluateBatchStatusVisibilityAccessControl,
    aclFilterApplier:   applyBatchStatusLookupVisibilityRules,
    transformer:        transformBatchStatusPaginatedLookupResult,
    rowEnricher:        enrichBatchStatusLookupWithActiveFlag,
    enrichmentCondition: (acl) => acl.canViewAllStatuses,
  });
};

// ---------------------------------------------------------------------------

const fetchPackagingMaterialSupplierLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  const activeStatusId = getStatusId('general_active');
  
  return executeLookupWorkflow({
    user,
    filters,
    limit,
    offset,
    repository:         getPackagingMaterialSupplierLookup,
    aclEvaluator:       evaluatePackagingMaterialSupplierLookupAccessControl,
    aclFilterApplier:   enforcePackagingMaterialSupplierLookupVisibilityRules,
    transformer:        transformPackagingMaterialSupplierPaginatedLookupResult,
    rowEnricher:        (row) => enrichPackagingMaterialSupplierLookupWithActiveFlag(row, activeStatusId),
    enrichmentCondition: (acl) => acl.canViewAllStatuses,
  });
};

// ---------------------------------------------------------------------------

module.exports = {
  fetchBatchRegistryLookupService,
  fetchWarehouseLookupService,
  fetchLotAdjustmentLookupService,
  fetchCustomerLookupService,
  fetchCustomerAddressLookupService,
  fetchOrderTypeLookupService,
  fetchPaginatedPaymentMethodLookupService,
  fetchPaginatedDiscountLookupService,
  fetchPaginatedTaxRateLookupService,
  fetchPaginatedDeliveryMethodLookupService,
  fetchPaginatedSkuLookupService,
  fetchPaginatedPricingLookupService,
  fetchPaginatedPackagingMaterialLookupService,
  fetchSkuCodeBaseLookupService,
  fetchProductLookupService,
  fetchStatusLookupService,
  fetchUserLookupService,
  fetchRoleLookupService,
  fetchManufacturerLookupService,
  fetchSupplierLookupService,
  fetchLocationTypeLookupService,
  fetchBatchStatusLookupService,
  fetchPackagingMaterialSupplierLookupService,
};
