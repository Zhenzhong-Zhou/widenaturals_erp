import { createAsyncThunk } from '@reduxjs/toolkit';
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
  UserLookupParams,
  UserLookupResponse,
} from '@features/lookup/state/lookupTypes';
import { lookupService } from '@services/lookupService';
import { extractErrorMessage } from '@utils/error';

/**
 * Thunk to fetch batch registry items for lookup use.
 *
 * This thunk supports optional filtering and pagination via query parameters.
 *
 * @param params - Optional query filters such as batch type, limit, offset, or exclusions.
 * @returns A fulfilled action with lookup items or a rejected action with a user-friendly error message.
 */
export const fetchBatchRegistryLookupThunk = createAsyncThunk<
  GetBatchRegistryLookupResponse, // fulfilled type
  GetBatchRegistryLookupParams,    // argument type
  { rejectValue: string }          // rejection payload type
>('lookup/fetchBatchRegistryLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchBatchRegistryLookup(params);
  } catch (error: unknown) {
    console.error('fetchBatchRegistryLookupThunk error:', error);
    return rejectWithValue(extractErrorMessage(error));
  }
});

/**
 * Async thunk to fetch warehouse lookup options.
 *
 * Fetches a list of active warehouses, optionally filtered by warehouse type.
 *
 * @param params Optional filter parameters (e.g. warehouseTypeId)
 * @returns A fulfilled action with lookup items or a rejected action with a user-friendly error message.
 */
export const fetchWarehouseLookupThunk = createAsyncThunk<
  GetWarehouseLookupResponse,               // fulfilled type
  { warehouseTypeId?: string } | undefined, // argument type
  { rejectValue: string }                   // rejection payload type
>('lookup/fetchWarehouseLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchWarehouseLookup(params?.warehouseTypeId);
  } catch (error: unknown) {
    console.error('fetchWarehouseLookupThunk error:', error);
    return rejectWithValue(extractErrorMessage(error));
  }
});

/**
 * Thunk to fetch active lot adjustment types for lookup use.
 *
 * This thunk calls the backend API to retrieve a list of lot adjustment types,
 * which are used in inventory-related forms and utilities such as quantity adjustment,
 * loss reporting, or defective handling.
 *
 * By default, it excludes internal-only adjustment types like `manual_stock_insert`
 * and `manual_stock_update`, which are used internally by system processes and not
 * meant for user-facing selection. This behavior can be controlled using the filter options.
 *
 * @param {LotAdjustmentLookupQueryParams} [filters] - Optional filters to control query behavior.
 * @returns {Promise<LotAdjustmentTypeLookupResponse>} A promise resolving to a list of lot adjustment types formatted for Lookups.
 *
 * @example
 * // Fetch adjustment types for lookup, excluding internal-only one's
 * dispatch(fetchLotAdjustmentTypeLookupThunk({ excludeInternal: true }));
 *
 * @example
 * // Fetch all adjustment types, including internal-use types
 * dispatch(fetchLotAdjustmentTypeLookupThunk({ excludeInternal: false }));
 */
export const fetchLotAdjustmentTypeLookupThunk = createAsyncThunk<
  LotAdjustmentTypeLookupResponse,               // fulfilled type
  LotAdjustmentLookupQueryParams | undefined,    // argument type
  { rejectValue: string }                        // rejection payload type
>(
  'lookups/fetchLotAdjustmentTypeLookup',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await lookupService.fetchLotAdjustmentTypeLookup(filters);
    } catch (error: unknown) {
      console.error('fetchLotAdjustmentTypeLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch customer lookup data from the server with optional filters.
 *
 * - Dispatches `pending`, `fulfilled`, and `rejected` actions automatically.
 * - Useful for dropdowns, autocompletes, or selection inputs that list customers.
 *
 * @param params - Optional filters such as `keyword`, `limit`, and `offset`
 * @returns A thunk action resolving to customer lookup data or error payload
 */
export const fetchCustomerLookupThunk = createAsyncThunk<
  CustomerLookupResponse,        // fulfilled type
  CustomerLookupQuery | undefined,
  { rejectValue: string }
>(
  'lookup/fetchCustomerLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchCustomerLookup(params);
    } catch (error: unknown) {
      console.error('fetchCustomerLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk action to fetch all addresses associated with a given customer ID.
 *
 * This thunk dispatches the following async action types:
 * - pending: when the request is initiated
 * - fulfilled: when address data is successfully retrieved
 * - rejected: when the request fails (e.g., network error or invalid customer ID)
 *
 * Used in workflows such as
 * - Sales order creation
 * - Shipping/billing address selection
 *
 * @param {string} customerId - UUID of the customer to fetch addresses for
 * @returns {Promise<AddressByCustomerLookupResponse>} - Promise resolving with address data
 */
export const fetchCustomerAddressesLookupThunk = createAsyncThunk<
  AddressByCustomerLookupResponse,  // fulfilled type
  string,                           // customerId
  { rejectValue: string }
>(
  'addresses/fetchByCustomerId',
  async (customerId, { rejectWithValue }) => {
    try {
      return await lookupService.fetchAddressesByCustomerId(customerId);
    } catch (error: unknown) {
      console.error('fetchCustomerAddressesLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch order type lookup data with optional query parameters.
 *
 * This is typically used for populating dynamic dropdowns, filters, or
 * selection menus related to order categories (e.g., manufacturing, retail).
 *
 * @param params - Optional query parameters such as `{ keyword: 'manufacturing' }`
 *                 to filter the list of order types by name or category.
 * @returns A promise that resolves to an `OrderTypeLookupResponse`, which contains
 *          a success flag, message, and a list of matched order types.
 *
 * @example
 * dispatch(fetchOrderTypeLookupThunk({ keyword: 'retail' }));
 *
 * @throws Will propagate and reject with the error message if the API request fails.
 */
export const fetchOrderTypeLookupThunk = createAsyncThunk<
  OrderTypeLookupResponse,
  OrderTypeLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookups/fetchOrderTypeLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchOrderTypeLookup(params);
    } catch (error: unknown) {
      console.error('fetchOrderTypeLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch payment method lookup data for dropdowns or autocomplete components.
 *
 * This thunk dispatches loading, success, and error states automatically,
 * and is designed for use in UI components that support paginated, keyword-based lookup.
 *
 * @function
 * @param {PaymentMethodLookupQueryParams} [params] - Optional query parameters (e.g., `keyword`, `limit`, `offset`) to filter the results.
 * @returns {Promise<PaymentMethodLookupResponse>} A promise resolving to a paginated list of payment method options.
 *
 * @example
 * dispatch(fetchPaymentMethodLookupThunk({ keyword: 'credit', limit: 10 }));
 *
 * @see PaymentMethodLookupQueryParams
 * @see PaymentMethodLookupResponse
 */
export const fetchPaymentMethodLookupThunk = createAsyncThunk<
  PaymentMethodLookupResponse,
  PaymentMethodLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchPaymentMethodLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchPaymentMethodLookup(params);
    } catch (error: unknown) {
      console.error('fetchPaymentMethodLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch a list of discounts for lookup UIs such as dropdowns or autocompletes.
 *
 * Supports keyword filtering and pagination through optional query parameters.
 * Typically used to populate discount selectors in sales forms or configuration panels.
 *
 * Dispatch lifecycle:
 * - `lookup/fetchDiscounts/pending`: when the request starts
 * - `lookup/fetchDiscounts/fulfilled`: when data is successfully fetched
 * - `lookup/fetchDiscounts/rejected`: when an error occurs
 *
 * @param params - Optional query parameters including `keyword`, `limit`, and `offset`.
 * @returns A promise resolving to a {@link DiscountLookupResponse} containing lookup items and metadata.
 */
export const fetchDiscountLookupThunk = createAsyncThunk<
  DiscountLookupResponse,
  DiscountLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchDiscounts',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchDiscountLookup(params);
    } catch (error: unknown) {
      console.error('fetchDiscountLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch a list of tax rates for use in lookup UIs such as dropdowns or configuration panels.
 *
 * Supports keyword filtering and pagination via query parameters.
 * Useful in billing, checkout, or tax setup workflows.
 *
 * Dispatch lifecycle:
 * - `lookup/fetchTaxRates/pending`: when the request is initiated
 * - `lookup/fetchTaxRates/fulfilled`: when the response is successful
 * - `lookup/fetchTaxRates/rejected`: if the request fails
 *
 * @param params - Optional query parameters like `keyword`, `limit`, and `offset`.
 * @returns A promise resolving to a {@link TaxRateLookupResponse} containing tax rate records and paging info.
 */
export const fetchTaxRateLookupThunk = createAsyncThunk<
  TaxRateLookupResponse,
  TaxRateLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchTaxRates',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchTaxRateLookup(params);
    } catch (error: unknown) {
      console.error('fetchTaxRateLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch a list of delivery methods for lookup UIs (e.g., order forms, shipping setup).
 *
 * Supports filtering by keyword and pickup flag (`isPickupLocation`) along with pagination.
 * Typically used in logistics, shipping, or order configuration flows.
 *
 * Dispatch lifecycle:
 * - `lookup/fetchDeliveryMethods/pending`: dispatched at the start of the request
 * - `lookup/fetchDeliveryMethods/fulfilled`: dispatched on successful response
 * - `lookup/fetchDeliveryMethods/rejected`: dispatched if an error occurs
 *
 * @param params - Optional filters including `keyword`, `isPickupLocation`, `limit`, and `offset`.
 * @returns A promise resolving to a {@link DeliveryMethodLookupResponse} with delivery method data and metadata.
 */
export const fetchDeliveryMethodLookupThunk = createAsyncThunk<
  DeliveryMethodLookupResponse,
  DeliveryMethodLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchDeliveryMethods',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchDeliveryMethodLookup(params);
    } catch (error: unknown) {
      console.error('fetchDeliveryMethodLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch SKU lookup options for dropdowns or autocomplete fields.
 *
 * Supports optional filtering by keyword, barcode inclusion, and enriched flags (e.g., `isNormal`, `issueReasons`).
 * Typically used in product selectors, order creation flows, or inventory management UI.
 *
 * Dispatch lifecycle:
 * - `lookup/fetchSkuLookup/pending`: dispatched at the start of the request
 * - `lookup/fetchSkuLookup/fulfilled`: dispatched on successful response
 * - `lookup/fetchSkuLookup/rejected`: dispatched if an error occurs
 *
 * @param params - Optional filters such as `keyword`, `includeBarcode`, `limit`, and `offset`.
 * @returns A {@link SkuLookupResponse} containing enriched SKU options and pagination metadata.
 */
export const fetchSkuLookupThunk = createAsyncThunk<
  SkuLookupResponse,
  SkuLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchSkuLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchSkuLookup(params);
    } catch (error: unknown) {
      console.error('fetchSkuLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch pricing lookup options for dropdowns or autocomplete fields.
 *
 * Supports optional filtering by SKU ID, keyword, and display options (e.g., `labelOnly`, `showSku`).
 * Returns either full or label-only pricing items, depending on user access and query configuration.
 *
 * Commonly used in pricing selectors, sales order forms, or discount pricing modules.
 *
 * Dispatch lifecycle:
 * - `lookup/fetchPricingLookup/pending`: dispatched at the start of the request
 * - `lookup/fetchPricingLookup/fulfilled`: dispatched on successful response
 * - `lookup/fetchPricingLookup/rejected`: dispatched if an error occurs
 *
 * @param params - Optional filters and display options including `keyword`, `filters.skuId`, `limit`, `offset`, and `displayOptions`.
 * @returns A {@link PricingLookupResponse} containing pricing options and pagination metadata.
 */
export const fetchPricingLookupThunk = createAsyncThunk<
  PricingLookupResponse,
  PricingLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchPricingLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchPricingLookup(params);
    } catch (error: unknown) {
      console.error('fetchPricingLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk to fetch packaging-material lookup options for dropdowns/autocomplete.
 *
 * Uses server-side filtering per `PackagingMaterialLookupQueryParams`, including:
 * - `keyword`
 * - `filters` (e.g., statusId, createdBy, updatedBy, restrictToUnarchived)
 * - `options` (e.g., labelOnly, mode: 'generic' | 'salesDropdown')
 * - `limit`, `offset`
 *
 * Dispatch lifecycle:
 * - `lookup/fetchPackagingMaterialLookup/pending`   — request started
 * - `lookup/fetchPackagingMaterialLookup/fulfilled` — response received
 * - `lookup/fetchPackagingMaterialLookup/rejected`  — request failed
 *
 * @param params Optional query params controlling filtering, options, and pagination.
 * @returns A {@link PackagingMaterialLookupResponse} with items and pagination metadata.
 */
export const fetchPackagingMaterialLookupThunk = createAsyncThunk<
  PackagingMaterialLookupResponse,
  PackagingMaterialLookupQueryParams | undefined,
  { rejectValue: string }
>(
  'lookup/fetchPackagingMaterialLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchPackagingMaterialLookup(params);
    } catch (error: unknown) {
      console.error('fetchPackagingMaterialLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk: Fetch paginated **SKU Code Base lookup** items from the server.
 *
 * This dispatches an async request to `lookupService.fetchSkuCodeBaseLookup`,
 * which calls `GET /lookups/sku-code-bases` and returns a typed
 * {@link SkuCodeBaseLookupResponse}.
 *
 * ## Behavior
 * - Sends optional query parameters (keyword, brand_code, category_code, limit, offset)
 * - Returns lookup items formatted for dropdown/autocomplete components
 * - On success → resolves with `SkuCodeBaseLookupResponse`
 * - On failure → rejects with `rejectValue: string` containing a readable error message
 *
 * ## Usage
 * ```ts
 * dispatch(fetchSkuCodeBaseLookupThunk({ keyword: 'CJ' }));
 * dispatch(fetchSkuCodeBaseLookupThunk({ brand_code: 'WN', limit: 20 }));
 * ```
 *
 * @param params Optional {@link SkuCodeBaseLookupParams} passed to the lookup service.
 *
 * @returns A Redux Toolkit `AsyncThunkAction` resolving to
 * `SkuCodeBaseLookupResponse` or rejecting with an error message.
 */
export const fetchSkuCodeBaseLookupThunk = createAsyncThunk<
  SkuCodeBaseLookupResponse,
  SkuCodeBaseLookupParams | undefined,
  { rejectValue: string }
>(
  'lookups/fetchSkuCodeBaseLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchSkuCodeBaseLookup(params);
    } catch (error: unknown) {
      console.error('fetchSkuCodeBaseLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk: Fetch paginated **Product lookup** items for dropdowns/selectors.
 *
 * Calls `lookupService.fetchProductLookup`, which hits `GET /lookups/products`
 * and returns a typed {@link ProductLookupResponse}.
 *
 * ## Behavior
 * - Accepts optional params such as:
 *   - keyword
 *   - filters.brand / filters.category / filters.series
 *   - limit / offset
 * - Successfully resolves with product lookup data
 * - Rejects with a readable error message if request fails
 *
 * ## Example
 * ```ts
 * dispatch(fetchProductLookupThunk({ keyword: 'Omega' }));
 *
 * dispatch(fetchProductLookupThunk({
 *   filters: { brand: 'Wide Naturals', category: 'Softgels' }
 * }));
 * ```
 *
 * @param params Optional {@link ProductLookupParams} for filtering and pagination.
 *
 * @returns A typed thunk action resolving to `ProductLookupResponse`
 *          or rejecting with `rejectValue: string`.
 */
export const fetchProductLookupThunk = createAsyncThunk<
  ProductLookupResponse,
  ProductLookupParams | undefined,
  { rejectValue: string }
>(
  'lookups/fetchProductLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchProductLookup(params);
    } catch (error: unknown) {
      console.error('fetchProductLookupThunk error:', error);
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * Thunk: Fetch paginated **Status lookup** items for dropdowns/selectors.
 *
 * Calls `lookupService.fetchStatusLookup`, which hits `GET /lookups/statuses`
 * and returns a typed {@link StatusLookupResponse}.
 *
 * ## Behavior
 * - Accepts optional params such as:
 *   - keyword
 *   - filters.name
 *   - filters.keyword
 *   - filters.is_active
 *   - limit / offset
 * - Resolves with Status lookup data
 * - Rejects with a readable error message if the request fails
 *
 * ## Example
 * ```ts
 * dispatch(fetchStatusLookupThunk({ keyword: 'active' }));
 *
 * dispatch(fetchStatusLookupThunk({
 *   filters: { is_active: true }
 * }));
 * ```
 *
 * @param params Optional {@link StatusLookupParams} for filtering and pagination.
 *
 * @returns A typed thunk action resolving to `StatusLookupResponse`
 *          or rejecting with `rejectValue: string`.
 */
export const fetchStatusLookupThunk = createAsyncThunk<
  StatusLookupResponse,              // fulfilled type
  StatusLookupParams | undefined,     // argument type
  { rejectValue: string }             // rejection payload type
>('lookups/fetchStatusLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchStatusLookup(params);
  } catch (error: unknown) {
    console.error('fetchStatusLookupThunk error:', error);
    return rejectWithValue(extractErrorMessage(error));
  }
});

/**
 * Thunk: Fetch paginated **User lookup** items for dropdowns/selectors.
 *
 * Calls `lookupService.fetchUserLookup`, which hits `GET /lookups/users`
 * and returns a typed {@link UserLookupResponse}.
 *
 * ## Behavior
 * - Accepts optional params such as:
 *   - keyword
 *   - isActive
 *   - isValidToday
 *   - limit / offset
 * - Resolves with User lookup data
 * - Rejects with a user-friendly error message
 *
 * @param params Optional {@link UserLookupParams} for filtering and pagination.
 *
 * @returns A typed thunk action resolving to `UserLookupResponse`
 *          or rejecting with `rejectValue: string`.
 */
export const fetchUserLookupThunk = createAsyncThunk<
  UserLookupResponse,                 // fulfilled type
  UserLookupParams | undefined,        // argument type
  { rejectValue: string }              // rejection payload type
>('lookups/fetchUserLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchUserLookup(params);
  } catch (error: unknown) {
    console.error('fetchUserLookupThunk error:', error);
    return rejectWithValue(extractErrorMessage(error));
  }
});
