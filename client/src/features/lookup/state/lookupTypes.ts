import type {
  ApiSuccessResponse,
  AsyncState,
  LookupSuccessResponse,
  PaginatedLookupState,
} from '@shared-types/api';

/**
 * Represents a generic option item used in lookup components.
 * Can be reused across forms, selectors, or any UI where value-label pairs are needed.
 */
export interface LookupOption {
  /** Display label shown to the user */
  label: string;
  /** Underlying value submitted or used in logic */
  value: string;
}

/**
 * Represents a generic lookup item returned from the API.
 * Used as a standard structure for paginated lookup responses before client mapping.
 */
export interface LookupItem {
  /** Unique identifier of the record, typically a database ID or UUID */
  id: string;
  /** Display label constructed for the client */
  label: string;
}

/**
 * Metadata used to control and manage paginated lookup queries.
 *
 * This interface is commonly used in components that support infinite scroll
 * or paginated dropdowns, where client-side pagination behavior is required
 * to load more options (e.g., customers, batches, etc.).
 */
export interface LookupPaginationMeta {
  /** The maximum number of results to retrieve per request */
  limit: number;
  
  /** The number of records to skip (i.e., pagination offset) */
  offset: number;
  
  /** Indicates if more results are available beyond the current set */
  hasMore?: boolean;
  
  /** Optional handler to fetch the next set of results when needed */
  onFetchMore?: () => void;
}

export interface GetBatchRegistryLookupParams {
  /**
   * Filter by batch type (e.g., 'product', 'packaging_material')
   */
  batchType?: 'product' | 'packaging_material' | string;

  /**
   * Optional warehouse ID to exclude batches already present in this warehouse
   */
  warehouseId?: string;

  /**
   * Optional location ID to exclude batches already present in this location
   */
  locationId?: string;

  /**
   * Number of items to retrieve (pagination limit)
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;
}

/**
 * Query parameters for fetching lot adjustment type lookup options.
 */
export interface LotAdjustmentLookupQueryParams {
  /**
   * Whether to exclude internal-only adjustment types such as
   * 'manual_stock_insert' and 'manual_stock_update'.
   * Defaults to `true` on the server if omitted.
   */
  excludeInternal?: boolean;
  
  /**
   * Whether to restrict results to only quantity adjustment types.
   * Useful for inventory adjustment forms where only quantity-related
   * actions are relevant.
   * Default to `false` if omitted.
   */
  restrictToQtyAdjustment?: boolean;
}

export interface ProductBatchLookupItem {
  id: string;
  type: 'product';
  product: {
    id: string;
    name: string;
    lotNumber: string;
    expiryDate: string;
  };
}

export interface PackagingMaterialLookupItem {
  id: string;
  type: 'packaging_material';
  packagingMaterial: {
    id: string;
    lotNumber: string;
    expiryDate: string;
    snapshotName: string;
    receivedLabel: string;
  };
}

export type BatchRegistryLookupItem =
  | ProductBatchLookupItem
  | PackagingMaterialLookupItem;

export type GetBatchRegistryLookupResponse =
  LookupSuccessResponse<BatchRegistryLookupItem>;

export type BatchRegistryLookupState =
  PaginatedLookupState<BatchRegistryLookupItem>;

export interface WarehouseLookupItem {
  value: string;
  label: string;
  metadata: {
    locationId: string;
    locationTypeId: string;
  };
}

export type GetWarehouseLookupResponse = ApiSuccessResponse<
  WarehouseLookupItem[]
>;

export interface GetWarehouseLookupFilters {
  locationTypeId?: string;
  warehouseTypeId?: string;
  includeArchived?: boolean;
}

export type WarehouseLookupState = AsyncState<WarehouseLookupItem[]>;

/**
 * Specialized alias for warehouse lookup options.
 * Reuses the generic LookupOption structure.
 */
export type WarehouseOption = LookupOption;

/**
 * Represents a single option in the lot adjustment lookup.
 */
export interface LotAdjustmentTypeLookupItem {
  /**
   * The unique identifier of the lot adjustment type.
   * Used as the `value` in lookup menus.
   */
  value: string;
  
  /**
   * The display label of the lot adjustment type.
   * Typically shown as the visible text in the lookup option.
   */
  label: string;
  
  /**
   * The unique identifier of the related inventory action type.
   * Used for internal mapping or further logic.
   */
  actionTypeId: string;
}

/**
 * Typed API response for fetching lot adjustment lookup options.
 */
export type LotAdjustmentTypeLookupResponse = ApiSuccessResponse<LotAdjustmentTypeLookupItem[]>;

export type LotAdjustmentTypeLookupState = AsyncState<LotAdjustmentTypeLookupItem[]>;

/**
 * Specialized alias for lot adjustment type lookup options.
 */
export type AdjustmentTypeOption = LookupOption;

export type BatchLookupOption = {
  value: string;
  label: string;
  type: string;
};

export interface CustomerLookupQuery {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerLookupItem extends LookupItem {
  hasAddress: boolean;
}

export type CustomerLookupResponse = LookupSuccessResponse<CustomerLookupItem>;

export type CustomerLookupState = PaginatedLookupState<CustomerLookupItem>;

export interface CustomerOption extends LookupOption {
  hasAddress: boolean;
}

/**
 * Represents a minimal address object returned by a customer-address lookup.
 * Typically used for selection or display in read-only workflows, such as orders.
 */
export interface AddressByCustomerLookup {
  /**
   * Unique identifier for the address.
   */
  id: string;
  
  /**
   * The name of the recipient for the address.
   */
  recipient_name: string;
  
  /**
   * Optional label to distinguish the address (e.g., "Shipping", "Billing").
   */
  label: string;
  
  /**
   * A fully formatted, human-readable version of the address.
   */
  formatted_address: string;
}

/**
 * API response containing a list of address lookup entries for a specific customer.
 * Used in endpoints like GET /addresses/by-customer.
 */
export type AddressByCustomerLookupResponse = ApiSuccessResponse<AddressByCustomerLookup[]>;

/**
 * Redux state for managing address lookup results by customer ID.
 *
 * This state is used in conjunction with the `addressByCustomerLookupSlice`
 * to support workflows such as
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile viewing
 *
 * Extends the generic `AsyncState<T>` to include:
 * - `data`: an array of address lookup entries
 * - `loading`: whether the lookup request is in progress
 * - `error`: any error message encountered during the fetch
 */
export type AddressByCustomerLookupState = AsyncState<AddressByCustomerLookup[]>;
