import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { buildQueryString } from '@utils/query';
import type {
  AddressByCustomerLookupResponse,
  BatchRegistryForInventoryLookupQuery,
  BatchRegistryLookupQuery,
  BatchRegistryLookupResponse,
  CustomerLookupQuery,
  CustomerLookupResponse,
  DeliveryMethodLookupQueryParams,
  DeliveryMethodLookupResponse,
  DiscountLookupQueryParams,
  DiscountLookupResponse,
  GetWarehouseLookupResponse,
  InventoryActionTypeLookupParams,
  InventoryActionTypeLookupResponse,
  InventoryStatusLookupParams,
  InventoryStatusLookupResponse,
  LocationLookupParams,
  LocationLookupResponse,
  LocationTypeLookupParams,
  LocationTypeLookupResponse,
  LotAdjustmentTypeLookupParams,
  LotAdjustmentTypeLookupResponse,
  ManufacturerLookupParams,
  ManufacturerLookupResponse,
  OrderTypeLookupQueryParams,
  OrderTypeLookupResponse,
  PackagingMaterialLookupQueryParams,
  PackagingMaterialLookupResponse,
  PaymentMethodLookupQueryParams,
  PaymentMethodLookupResponse,
  PricingGroupLookupQueryParams,
  PricingGroupLookupResponse,
  PricingTypeLookupParams,
  PricingTypeLookupResponse,
  ProductLookupParams,
  ProductLookupResponse,
  RoleLookupParams,
  RoleLookupResponse,
  SkuCodeBaseLookupParams,
  SkuCodeBaseLookupResponse,
  SkuLookupQueryParams,
  SkuLookupResponse,
  StatusLookupParams,
  StatusLookupResponse,
  SupplierLookupParams,
  SupplierLookupResponse,
  TaxRateLookupQueryParams,
  TaxRateLookupResponse,
  UserLookupParams,
  UserLookupResponse,
  WarehouseTypeLookupParams,
  WarehouseTypeLookupResponse,
} from '@features/lookup/state/lookupTypes';

/* =========================================================
 * Internal lookup helper (READ-only, lookup-only)
 * ======================================================= */

/**
 * Executes a typed lookup GET request.
 *
 * Intended ONLY for lookup-style endpoints:
 * - Read-only
 * - Idempotent
 * - No domain transformation
 * - READ transport policy
 *
 * @internal
 */
const getLookup = <T>(endpoint: string, params?: object): Promise<T> => {
  const queryString = buildQueryString(params);
  return getRequest<T>(`${endpoint}${queryString}`);
};

/* =========================================================
 * Batch / Warehouse
 * ======================================================= */

/**
 * Fetch general batch registry lookup items.
 *
 * Calls GET /lookups/batch-registry. Not coupled to a warehouse — the
 * caller's ACL narrows results by batch status and product/packaging
 * visibility on the server. Used for filter dropdowns and allocation pickers.
 */
const fetchBatchRegistryLookup = (
  params: BatchRegistryLookupQuery = {}
): Promise<BatchRegistryLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.BATCH_REGISTRY, params);

/**
 * Fetch batch registry lookup items scoped to a target warehouse.
 *
 * Calls GET /lookups/batch-registry/for-inventory. Used by the warehouse-
 * inventory batch-add flow. Default behavior excludes batches already placed
 * in the warehouse and restricts to released batches; canViewAllWarehouses /
 * canViewAllBatchStatus privileges strip those constraints server-side.
 * warehouseId is required at the type level, so there is no default params.
 */
const fetchBatchRegistryForInventoryLookup = (
  params: BatchRegistryForInventoryLookupQuery
): Promise<BatchRegistryLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.BATCH_REGISTRY_FOR_INVENTORY, params);

/** Fetch warehouse lookup items, optionally filtered by type. */
const fetchWarehouseLookup = (
  warehouseTypeId?: string
): Promise<GetWarehouseLookupResponse> =>
  getLookup(
    API_ENDPOINTS.LOOKUPS.WAREHOUSES,
    warehouseTypeId ? { warehouseTypeId } : undefined
  );

/* =========================================================
 * Inventory / Adjustment
 * ======================================================= */

/** Fetch inventory action type lookup items. */
export const fetchInventoryActionTypeLookup = (
  params?: InventoryActionTypeLookupParams
): Promise<InventoryActionTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.INVENTORY_ACTION_TYPES, params);

/** Fetch lot adjustment type lookup items. */
export const fetchLotAdjustmentTypeLookup = (
  params?: LotAdjustmentTypeLookupParams
): Promise<LotAdjustmentTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.LOT_ADJUSTMENT_TYPES, params);

/* =========================================================
 * Customer / Address
 * ======================================================= */

/** Fetch customer lookup items (autocomplete / dropdown). */
const fetchCustomerLookup = (
  params?: CustomerLookupQuery
): Promise<CustomerLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.CUSTOMERS, params);

/** Fetch all addresses belonging to a customer. */
const fetchAddressesByCustomerId = (
  customerId: string
): Promise<AddressByCustomerLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.ADDRESSES_BY_CUSTOMER, { customerId });

/* =========================================================
 * Order / Payment / Pricing
 * ======================================================= */

/** Fetch order type lookup items. */
const fetchOrderTypeLookup = (
  params?: OrderTypeLookupQueryParams
): Promise<OrderTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.ORDER_TYPES, params);

/** Fetch payment method lookup items. */
const fetchPaymentMethodLookup = (
  params?: PaymentMethodLookupQueryParams
): Promise<PaymentMethodLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PAYMENT_METHODS, params);

/** Fetch discount lookup items. */
const fetchDiscountLookup = (
  params?: DiscountLookupQueryParams
): Promise<DiscountLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.DISCOUNTS, params);

/** Fetch tax rate lookup items. */
const fetchTaxRateLookup = (
  params?: TaxRateLookupQueryParams
): Promise<TaxRateLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.TAX_RATES, params);

/** Fetch delivery method lookup items. */
const fetchDeliveryMethodLookup = (
  params?: DeliveryMethodLookupQueryParams
): Promise<DeliveryMethodLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.DELIVERY_METHODS, params);

/** Fetch pricing group lookup items. */
const fetchPricingGroupLookup = (
  params?: PricingGroupLookupQueryParams
): Promise<PricingGroupLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PRICING_GROUPS, params);

/* =========================================================
 * SKU / Product / Status
 * ======================================================= */

/** Fetch SKU lookup items. */
const fetchSkuLookup = (
  params?: SkuLookupQueryParams
): Promise<SkuLookupResponse> => getLookup(API_ENDPOINTS.LOOKUPS.SKUS, params);

/** Fetch packaging material lookup items. */
const fetchPackagingMaterialLookup = (
  params?: PackagingMaterialLookupQueryParams
): Promise<PackagingMaterialLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PACKAGING_MATERIALS, params);

/** Fetch SKU code base lookup items. */
const fetchSkuCodeBaseLookup = (
  params?: SkuCodeBaseLookupParams
): Promise<SkuCodeBaseLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.SKU_CODE_BASES, params);

/** Fetch product lookup items. */
const fetchProductLookup = (
  params?: ProductLookupParams
): Promise<ProductLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PRODUCTS, params);

/** Fetch status lookup items. */
const fetchStatusLookup = (
  params?: StatusLookupParams
): Promise<StatusLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.STATUSES, params);

/** Fetch user lookup items. */
const fetchUserLookup = (
  params?: UserLookupParams
): Promise<UserLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.USERS, params);

/** Fetch role lookup items. */
const fetchRoleLookup = (
  params?: RoleLookupParams
): Promise<RoleLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.ROLES, params);

/** Fetch manufacturer lookup items. */
export const fetchManufacturerLookup = (
  params?: ManufacturerLookupParams
): Promise<ManufacturerLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.MANUFACTURERS, params);

/** Fetch supplier lookup items. */
export const fetchSupplierLookup = (
  params?: SupplierLookupParams
): Promise<SupplierLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.SUPPLIERS, params);

/** Fetch location type lookup items. */
export const fetchLocationTypeLookup = (
  params?: LocationTypeLookupParams
): Promise<LocationTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.LOCATION_TYPES, params);

/** Fetch inventory status lookup items. */
export const fetchInventoryStatusLookup = (
  params?: InventoryStatusLookupParams
): Promise<InventoryStatusLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.INVENTORY_STATUS, params);

/** Fetch pricing type lookup items. */
export const fetchPricingTypeLookup = (
  params?: PricingTypeLookupParams
): Promise<PricingTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PRICING_TYPES, params);

/** Fetch warehouse type lookup items. */
export const fetchWarehouseTypeLookup = (
  params?: WarehouseTypeLookupParams
): Promise<WarehouseTypeLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.WAREHOUSES_TYPES, params);

/** Fetch location lookup items. */
export const fetchLocationLookup = (
  params?: LocationLookupParams
): Promise<LocationLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.LOCATIONS, params);

/* =========================================================
 * Public API
 * ======================================================= */

export const lookupService = {
  fetchBatchRegistryLookup,
  fetchBatchRegistryForInventoryLookup,
  fetchWarehouseLookup,
  fetchInventoryActionTypeLookup,
  fetchLotAdjustmentTypeLookup,
  fetchCustomerLookup,
  fetchAddressesByCustomerId,
  fetchOrderTypeLookup,
  fetchPaymentMethodLookup,
  fetchDiscountLookup,
  fetchTaxRateLookup,
  fetchDeliveryMethodLookup,
  fetchSkuLookup,
  fetchPricingGroupLookup,
  fetchPackagingMaterialLookup,
  fetchSkuCodeBaseLookup,
  fetchProductLookup,
  fetchStatusLookup,
  fetchUserLookup,
  fetchRoleLookup,
  fetchManufacturerLookup,
  fetchSupplierLookup,
  fetchLocationTypeLookup,
  fetchInventoryStatusLookup,
  fetchPricingTypeLookup,
  fetchWarehouseTypeLookup,
  fetchLocationLookup,
};
