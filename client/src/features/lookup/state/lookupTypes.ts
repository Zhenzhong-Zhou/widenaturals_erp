import type {
  ApiSuccessResponse,
  AsyncState, LookupPagination,
  LookupSuccessResponse,
  PaginatedLookupState, PaginationLookupInfo,
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
 * Common structure for lookup-style query inputs (e.g., dropdowns, autocomplete).
 */
export interface LookupQuery extends LookupPagination {
  /**
   * Optional keyword to filter or search items.
   */
  keyword?: string;
}

/**
 * Metadata used to control and manage paginated lookup queries.
 *
 * Commonly used in components supporting infinite scroll or paginated dropdowns,
 * where client-side pagination behavior is required to load more options.
 */
export interface LookupPaginationMeta extends PaginationLookupInfo {
  /**
   * Optional handler to fetch the next set of results when needed.
   * Used in infinite scroll, load-more buttons, etc.
   */
  onFetchMore?: () => void;
}

/**
 * Query parameters for fetching batch registry lookup data.
 */
export interface GetBatchRegistryLookupParams extends LookupPagination {
  /**
   * Filter by batch type (e.g., 'product', 'packaging_material').
   */
  batchType?: 'product' | 'packaging_material' | string;
  
  /**
   * Optional warehouse ID to exclude batches already present in this warehouse.
   */
  warehouseId?: string;
  
  /**
   * Optional location ID to exclude batches already present in this location.
   */
  locationId?: string;
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

/**
 * Lookup option for selecting a warehouse, with additional metadata.
 */
export interface WarehouseLookupItem extends LookupOption {
  /**
   * Additional metadata associated with the selected warehouse.
   */
  metadata: {
    /** ID of the location the warehouse belongs to */
    locationId: string;
    
    /** Type ID of the location (e.g., warehouse, retail, fulfillment) */
    locationTypeId: string;
  };
}

export type GetWarehouseLookupResponse = ApiSuccessResponse<
  WarehouseLookupItem[]
>;

export type WarehouseLookupState = AsyncState<WarehouseLookupItem[]>;

/**
 * Specialized alias for warehouse lookup options.
 * Reuses the generic LookupOption structure.
 */
export type WarehouseOption = LookupOption;

/**
 * Represents a single option in the lot adjustment lookup.
 */
export interface LotAdjustmentTypeLookupItem extends LookupOption {
  /**
   * The unique identifier of the related inventory action type.
   * Used for internal mapping or further logic.
   */
  actionTypeId: string;
}

/**
 * Typed API response for fetching lot adjustment lookup options.
 */
export type LotAdjustmentTypeLookupResponse = ApiSuccessResponse<
  LotAdjustmentTypeLookupItem[]
>;

export type LotAdjustmentTypeLookupState = AsyncState<
  LotAdjustmentTypeLookupItem[]
>;

/**
 * Specialized alias for lot adjustment type lookup options.
 */
export type AdjustmentTypeOption = LookupOption;

/**
 * Represents a batch option in a lookup menu, including its type (e.g., product, packaging).
 */
export interface BatchLookupOption extends LookupOption {
  /**
   * The type of the batch (e.g., 'product', 'packaging_material').
   */
  type: string;
}

/**
 * Query parameters for fetching customer lookup results.
 */
export type CustomerLookupQuery = LookupQuery;

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
export type AddressByCustomerLookupResponse = ApiSuccessResponse<
  AddressByCustomerLookup[]
>;

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
export type AddressByCustomerLookupState = AsyncState<
  AddressByCustomerLookup[]
>;

export interface OrderTypeLookupQueryParams {
  /**
   * Optional search keyword for filtering order types by name or category.
   */
  keyword?: string;
}

export interface OrderTypeLookupItem {
  id: string;
  name: string;
  category: string;
}

export type OrderTypeLookupResponse = ApiSuccessResponse<OrderTypeLookupItem[]>;

export type OrderTypeLookupState = AsyncState<OrderTypeLookupItem[]>;

/**
 * Query parameters for fetching payment method lookup results.
 * This is a direct alias of LookupQuery and cannot be extended further.
 */
export type PaymentMethodLookupQueryParams = LookupQuery;

/**
 * A single payment method item returned from the API lookup.
 *
 * Based on the standard lookup item structure of `{ id, label }`.
 */
export type PaymentMethodLookupItem = LookupItem;

/**
 * Response structure for the payment method lookup endpoint.
 *
 * Wraps a paginated array of `PaymentMethodLookupItem` and includes
 * lookup-specific pagination metadata.
 */
export type PaymentMethodLookupResponse = LookupSuccessResponse<PaymentMethodLookupItem>;

/**
 * Redux state for payment method lookup results.
 * Includes async and pagination metadata for infinite-scroll or paginated dropdowns.
 */
export type PaymentMethodLookupState = PaginatedLookupState<LookupOption>;
