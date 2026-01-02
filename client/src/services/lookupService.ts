import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';
import type {
  AddressByCustomerLookupResponse,
  CustomerLookupQuery,
  CustomerLookupResponse,
  DeliveryMethodLookupQueryParams,
  DeliveryMethodLookupResponse,
  DiscountLookupQueryParams,
  DiscountLookupResponse,
  GetBatchRegistryLookupParams,
  GetBatchRegistryLookupResponse,
  GetWarehouseLookupResponse,
  LotAdjustmentLookupQueryParams,
  LotAdjustmentTypeLookupResponse,
  OrderTypeLookupQueryParams,
  OrderTypeLookupResponse,
  PackagingMaterialLookupQueryParams,
  PackagingMaterialLookupResponse,
  PaymentMethodLookupQueryParams,
  PaymentMethodLookupResponse,
  PricingLookupQueryParams,
  PricingLookupResponse,
  ProductLookupParams,
  ProductLookupResponse,
  SkuCodeBaseLookupParams,
  SkuCodeBaseLookupResponse,
  SkuLookupQueryParams,
  SkuLookupResponse,
  StatusLookupParams,
  StatusLookupResponse,
  TaxRateLookupQueryParams,
  TaxRateLookupResponse,
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

/** Fetch batch registry lookup items. */
const fetchBatchRegistryLookup = (
  params: GetBatchRegistryLookupParams = {}
): Promise<GetBatchRegistryLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.BATCH_REGISTRY, params);

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

/** Fetch lot adjustment type lookup items. */
const fetchLotAdjustmentTypeLookup = (
  params: LotAdjustmentLookupQueryParams = {}
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

/** Fetch pricing lookup items. */
const fetchPricingLookup = (
  params?: PricingLookupQueryParams
): Promise<PricingLookupResponse> =>
  getLookup(API_ENDPOINTS.LOOKUPS.PRICING, params);

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

/* =========================================================
 * Public API
 * ======================================================= */

export const lookupService = {
  fetchBatchRegistryLookup,
  fetchWarehouseLookup,
  fetchLotAdjustmentTypeLookup,
  fetchCustomerLookup,
  fetchAddressesByCustomerId,
  fetchOrderTypeLookup,
  fetchPaymentMethodLookup,
  fetchDiscountLookup,
  fetchTaxRateLookup,
  fetchDeliveryMethodLookup,
  fetchSkuLookup,
  fetchPricingLookup,
  fetchPackagingMaterialLookup,
  fetchSkuCodeBaseLookup,
  fetchProductLookup,
  fetchStatusLookup,
};
