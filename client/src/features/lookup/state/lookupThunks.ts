/**
 * ================================================================
 * Lookup Thunks Module
 * ================================================================
 *
 * Purpose:
 * - Provides thin Redux async thunks for dropdown/autocomplete lookups.
 * - Delegates all data access to `lookupService`.
 * - Contains no domain or business logic.
 *
 * Architecture:
 * - Pure API boundary adapters
 * - Typed with `rejectValue: UiErrorPayload`
 * - Errors normalized via `extractUiErrorPayload`
 *
 * Design Rule:
 * - Lookup thunks remain minimal and consistent.
 * - No transformation or domain logic inside this file.
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { lookupService } from '@services/lookupService';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
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

/* ------------------------- Core Lookups ------------------------- */

export const fetchBatchRegistryLookupThunk = createAsyncThunk<
  BatchRegistryLookupResponse,
  BatchRegistryLookupQuery,
  { rejectValue: UiErrorPayload }
>('lookup/fetchBatchRegistryLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchBatchRegistryLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchBatchRegistryForInventoryLookupThunk = createAsyncThunk<
  BatchRegistryLookupResponse,
  BatchRegistryForInventoryLookupQuery,
  { rejectValue: UiErrorPayload }
>(
  'lookup/batchRegistryForInventoryLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchBatchRegistryForInventoryLookup(params);
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

export const fetchWarehouseLookupThunk = createAsyncThunk<
  GetWarehouseLookupResponse,
  { warehouseTypeId?: string } | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchWarehouseLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchWarehouseLookup(params?.warehouseTypeId);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Lot adjustment type
// ---------------------------------------------------------------------------

export const fetchLotAdjustmentTypeLookupThunk = createAsyncThunk<
  LotAdjustmentTypeLookupResponse,
  LotAdjustmentTypeLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>(
  'lookup/fetchLotAdjustmentTypeLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchLotAdjustmentTypeLookup(params);
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/* ------------------------- Customer Lookups ------------------------- */

export const fetchCustomerLookupThunk = createAsyncThunk<
  CustomerLookupResponse,
  CustomerLookupQuery | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchCustomerLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchCustomerLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchCustomerAddressesLookupThunk = createAsyncThunk<
  AddressByCustomerLookupResponse,
  string,
  { rejectValue: UiErrorPayload }
>('lookup/fetchCustomerAddresses', async (customerId, { rejectWithValue }) => {
  try {
    return await lookupService.fetchAddressesByCustomerId(customerId);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/* ------------------------- Order & Finance Lookups ------------------------- */

export const fetchOrderTypeLookupThunk = createAsyncThunk<
  OrderTypeLookupResponse,
  OrderTypeLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchOrderTypeLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchOrderTypeLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchPaymentMethodLookupThunk = createAsyncThunk<
  PaymentMethodLookupResponse,
  PaymentMethodLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchPaymentMethodLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchPaymentMethodLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchDiscountLookupThunk = createAsyncThunk<
  DiscountLookupResponse,
  DiscountLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchDiscounts', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchDiscountLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchDeliveryMethodLookupThunk = createAsyncThunk<
  DeliveryMethodLookupResponse,
  DeliveryMethodLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchDeliveryMethodLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchDeliveryMethodLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchTaxRateLookupThunk = createAsyncThunk<
  TaxRateLookupResponse,
  TaxRateLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchTaxRates', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchTaxRateLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/* ------------------------- Inventory & Product Lookups ------------------------- */

export const fetchSkuCodeBaseLookupThunk = createAsyncThunk<
  SkuCodeBaseLookupResponse,
  SkuCodeBaseLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchSkuCodeBaseLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchSkuCodeBaseLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchSkuLookupThunk = createAsyncThunk<
  SkuLookupResponse,
  SkuLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchSkuLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchSkuLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchPricingGroupLookupThunk = createAsyncThunk<
  PricingGroupLookupResponse,
  PricingGroupLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchPricingGroupLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchPricingGroupLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchProductLookupThunk = createAsyncThunk<
  ProductLookupResponse,
  ProductLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchProductLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchProductLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchPackagingMaterialLookupThunk = createAsyncThunk<
  PackagingMaterialLookupResponse,
  PackagingMaterialLookupQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>(
  'lookup/fetchPackagingMaterialLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchPackagingMaterialLookup(params);
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/* ------------------------- Admin Lookups ------------------------- */

export const fetchStatusLookupThunk = createAsyncThunk<
  StatusLookupResponse,
  StatusLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchStatusLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchStatusLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchUserLookupThunk = createAsyncThunk<
  UserLookupResponse,
  UserLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchUserLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchUserLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchRoleLookupThunk = createAsyncThunk<
  RoleLookupResponse,
  RoleLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchRoleLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchRoleLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchManufacturerLookupThunk = createAsyncThunk<
  ManufacturerLookupResponse,
  ManufacturerLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchManufacturerLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchManufacturerLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchSupplierLookupThunk = createAsyncThunk<
  SupplierLookupResponse,
  SupplierLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchSupplierLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchSupplierLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

export const fetchLocationTypeLookupThunk = createAsyncThunk<
  LocationTypeLookupResponse,
  LocationTypeLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchLocationTypeLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchLocationTypeLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Inventory Status
// ---------------------------------------------------------------------------

export const fetchInventoryStatusLookupThunk = createAsyncThunk<
  InventoryStatusLookupResponse,
  InventoryStatusLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchInventoryStatusLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchInventoryStatusLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Pricing Type
// ---------------------------------------------------------------------------

export const fetchPricingTypeLookupThunk = createAsyncThunk<
  PricingTypeLookupResponse,
  PricingTypeLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchPricingTypeLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchPricingTypeLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Warehouse Type
// ---------------------------------------------------------------------------

export const fetchWarehouseTypeLookupThunk = createAsyncThunk<
  WarehouseTypeLookupResponse,
  WarehouseTypeLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchWarehouseTypeLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchWarehouseTypeLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export const fetchLocationLookupThunk = createAsyncThunk<
  LocationLookupResponse,
  LocationLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>('lookup/fetchLocationLookup', async (params, { rejectWithValue }) => {
  try {
    return await lookupService.fetchLocationLookup(params);
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

// ---------------------------------------------------------------------------
// Inventory action type
// ---------------------------------------------------------------------------

export const fetchInventoryActionTypeLookupThunk = createAsyncThunk<
  InventoryActionTypeLookupResponse,
  InventoryActionTypeLookupParams | undefined,
  { rejectValue: UiErrorPayload }
>(
  'lookup/fetchInventoryActionTypeLookup',
  async (params, { rejectWithValue }) => {
    try {
      return await lookupService.fetchInventoryActionTypeLookup(params);
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
