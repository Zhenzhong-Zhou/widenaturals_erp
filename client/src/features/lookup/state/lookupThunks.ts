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
  OrderTypeLookupResponse, PackagingMaterialLookupQueryParams, PackagingMaterialLookupResponse,
  PaymentMethodLookupQueryParams,
  PaymentMethodLookupResponse,
  PricingLookupQueryParams,
  PricingLookupResponse,
  SkuLookupQueryParams,
  SkuLookupResponse,
  TaxRateLookupQueryParams,
  TaxRateLookupResponse,
} from '@features/lookup/state/lookupTypes';
import { lookupService } from '@services/lookupService';

/**
 * Thunk to fetch batch registry items for lookup use.
 *
 * This thunk supports optional filtering and pagination via query parameters.
 *
 * @param params - Optional query filters such as batch type, limit, offset, or exclusions.
 * @returns A fulfilled action with lookup items or a rejected action with an error message.
 */
export const fetchBatchRegistryLookupThunk = createAsyncThunk<
  GetBatchRegistryLookupResponse, // Return type on success
  GetBatchRegistryLookupParams, // Argument type
  { rejectValue: string } // Rejection payload type
>('lookup/fetchBatchRegistryLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchBatchRegistryLookup(params);
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || 'Failed to fetch lookup items'
    );
  }
});

/**
 * Async thunk to fetch warehouse lookup options.
 *
 * Fetches a list of active warehouses, optionally filtered by warehouse type.
 *
 * @param {string | undefined} [warehouseTypeId] - Optional warehouse type ID for filtering
 * @returns {Promise<GetWarehouseLookupResponse>} - API response with lookup items
 */
export const fetchWarehouseLookupThunk = createAsyncThunk<
  GetWarehouseLookupResponse, // return type
  { warehouseTypeId?: string } | undefined
>('lookup/fetchWarehouseLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchWarehouseLookup(params?.warehouseTypeId);
  } catch (error: any) {
    return rejectWithValue({
      message:
        error?.response?.data?.message || 'Failed to load warehouse lookup',
      status: error?.response?.status || 500,
    });
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
  LotAdjustmentTypeLookupResponse, // return type
  LotAdjustmentLookupQueryParams | undefined // input param type
>(
  'Lookups/fetchLotAdjustmentTypeLookup',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await lookupService.fetchLotAdjustmentTypeLookup(filters);
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error.message);
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
  CustomerLookupResponse, // The resolved data shape on success
  CustomerLookupQuery | undefined, // The argument passed to the thunk
  {
    rejectValue: string | object; // Type for the reject payload
  }
>('lookup/fetchCustomerLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchCustomerLookup(params);
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data || 'Failed to fetch customer lookup'
    );
  }
});

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
  AddressByCustomerLookupResponse,
  string,
  {
    rejectValue: { message: string };
  }
>('addresses/fetchByCustomerId', async (customerId, { rejectWithValue }) => {
  try {
    return await lookupService.fetchAddressesByCustomerId(customerId);
  } catch (error) {
    console.error('fetchCustomerAddressesThunk failed:', error);
    return rejectWithValue({
      message: 'Failed to load customer addresses',
    });
  }
});

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
  OrderTypeLookupResponse, // return type
  OrderTypeLookupQueryParams | undefined // input type
>('lookups/fetchOrderTypeLookup', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchOrderTypeLookup(params);
  } catch (error: any) {
    console.error('Thunk failed to fetch order type lookup:', error);
    return thunkAPI.rejectWithValue(error?.message ?? 'Unknown error');
  }
});

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
 * dispatch(fetchPaymentMethodLookup({ keyword: 'credit', limit: 10 }));
 *
 * @see PaymentMethodLookupQueryParams
 * @see PaymentMethodLookupResponse
 */
export const fetchPaymentMethodLookup = createAsyncThunk<
  PaymentMethodLookupResponse,                 // Return type on success
  PaymentMethodLookupQueryParams | undefined  // Arg type
>(
  'lookup/fetchPaymentMethodLookup',
  async (params, thunkAPI) => {
    try {
      return await lookupService.fetchPaymentMethodLookup(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
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
  DiscountLookupQueryParams | undefined
>('lookup/fetchDiscounts', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchDiscountLookup(params);
  } catch (error) {
    console.error('Failed to fetch discounts:', error);
    return thunkAPI.rejectWithValue(error);
  }
});

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
  TaxRateLookupQueryParams | undefined
>('lookup/fetchTaxRates', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchTaxRateLookup(params);
  } catch (error) {
    console.error('Failed to fetch tax rates:', error);
    return thunkAPI.rejectWithValue(error);
  }
});

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
  DeliveryMethodLookupQueryParams | undefined
>('lookup/fetchDeliveryMethods', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchDeliveryMethodLookup(params);
  } catch (error) {
    console.error('Failed to fetch delivery methods:', error);
    return thunkAPI.rejectWithValue(error);
  }
});

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
  SkuLookupQueryParams | undefined
>('lookup/fetchSkuLookup', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchSkuLookup(params);
  } catch (error) {
    console.error('Failed to fetch SKU lookup:', error);
    return thunkAPI.rejectWithValue(error);
  }
});

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
  PricingLookupQueryParams | undefined
>('lookup/fetchPricingLookup', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchPricingLookup(params);
  } catch (error) {
    console.error('Failed to fetch pricing lookup:', error);
    return thunkAPI.rejectWithValue(error);
  }
});

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
  PackagingMaterialLookupQueryParams | undefined
>('lookup/fetchPackagingMaterialLookup', async (params, thunkAPI) => {
  try {
    return await lookupService.fetchPackagingMaterialLookup(params);
  } catch (error) {
    console.error('Failed to fetch packaging-material lookup:', error);
    return thunkAPI.rejectWithValue(error);
  }
});
