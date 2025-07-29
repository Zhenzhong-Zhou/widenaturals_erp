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
 * Common flags for filtering active and currently valid records.
 */
export interface ActiveValidFilter {
  /**
   * Optional flag to include only active records.
   */
  isActive?: boolean;
  
  /**
   * Optional flag to include only currently valid records (e.g., based on valid_from/valid_to).
   */
  isValidToday?: boolean;
}

/**
 * Represents a lookup item with common status flags.
 */
export type LookupItemWithStatus = LookupItem & ActiveValidFilter;

/**
 * Creates the initial state structure for a paginated lookup slice.
 *
 * This utility is used to initialize Redux state for dropdowns, autocomplete,
 * or infinite scroll components that fetch paginated data.
 *
 * @template T - The type of individual lookup items (e.g., DiscountLookupItem).
 * @returns A default-initialized {@link PaginatedLookupState} with empty data, no error, and pagination metadata.
 */
export const createInitialPaginatedLookupState = <T>(): PaginatedLookupState<T> => ({
  data: [],
  loading: false,
  error: null,
  limit: 50,
  offset: 0,
  hasMore: false,
});

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

/**
 * Query parameters for fetching order type lookup results.
 *
 * These parameters are typically used in dropdowns, autocompletes,
 * or filtering UIs where users can select or narrow down order types.
 */
export interface OrderTypeLookupQueryParams {
  /**
   * Optional search keyword for filtering order types by name or code.
   * Partial matches using ILIKE (case-insensitive) are supported.
   */
  keyword?: string;
  
  /**
   * Optional category filter to restrict the lookup results to a specific order type category.
   * If not provided, all accessible categories may be included based on user permissions.
   */
  category?: string;
}

/**
 * Represents a single order type option for use in dropdown or autocomplete components.
 *
 * This structure is produced by transforming raw `order_types` records into a UI-friendly format.
 * Fields are conditionally included based on user access permissions.
 *
 * @property {string} id - Unique identifier for the order type.
 * @property {string} label - Display name shown in the UI (may include category prefix).
 * @property {boolean} isRequiredPayment - Indicates whether this order type expects payment.
 * @property {boolean} [isActive] - Optional flag indicating if the order type is currently active (included if permitted).
 * @property {string} [category] - Optional category name for this order type (included if permitted).
 */
export interface OrderTypeLookupItem {
  id: string;
  label: string;
  isRequiredPayment: boolean;
  isActive?: boolean;
  category?: string;
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
export type PaymentMethodLookupState = PaginatedLookupState<PaymentMethodLookupItem>;

/**
 * Query parameters for fetching discount lookup results.
 * This is a direct alias of LookupQuery and cannot be extended further.
 */
export type DiscountLookupQueryParams = LookupQuery;

/**
 * Query parameters for fetching tax rate lookup results.
 * This is a direct alias of LookupQuery and cannot be extended further.
 */
export type TaxRateLookupQueryParams = LookupQuery;

/**
 * Query parameters for delivery method lookup (e.g., dropdowns, filters).
 */
export interface DeliveryMethodLookupQueryParams extends LookupQuery {
  /**
   * Optional flag to filter by pickup location.
   * Accepts true/false, 'true'/'false', or 1/0 depending on parsing.
   */
  isPickupLocation?: boolean;
}

/**
 * Represents a discount option with active/valid status for dropdowns or autocomplete.
 */
export type DiscountLookupItem = LookupItemWithStatus;

/**
 * Represents a tax rate option with active/valid status for dropdowns or autocomplete.
 */
export type TaxRateLookupItem = LookupItemWithStatus;

/**
 * Represents a delivery method option with status flags and pickup location flag.
 */
export type DeliveryMethodLookupItem = LookupItemWithStatus & {
  /**
   * Indicates whether this method is a pickup location (e.g., in-store pickup).
   */
  isPickupLocation?: boolean;
};

/**
 * API response format for discount lookup queries.
 * Contains a list of discount options with status flags.
 */
export type DiscountLookupResponse = LookupSuccessResponse<DiscountLookupItem>;

/**
 * API response format for tax rate lookup queries.
 * Contains a list of tax rate options with status flags.
 */
export type TaxRateLookupResponse = LookupSuccessResponse<TaxRateLookupItem>;

/**
 * API response format for delivery method lookup queries.
 * Contains a list of delivery method options with status and pickup flags.
 */
export type DeliveryMethodLookupResponse = LookupSuccessResponse<DeliveryMethodLookupItem>;

/**
 * Redux state for discount lookup results.
 * Includes async and pagination metadata for infinite-scroll or paginated dropdowns.
 */
export type DiscountLookupState = PaginatedLookupState<DiscountLookupItem>;

/**
 * Redux state for tax rate lookup results.
 * Includes async and pagination metadata for infinite-scroll or paginated dropdowns.
 */
export type TaxRateLookupState = PaginatedLookupState<TaxRateLookupItem>;

/**
 * Redux state for delivery method lookup results.
 * Includes async and pagination metadata for infinite-scroll or paginated dropdowns.
 */
export type DeliveryMethodLookupState = PaginatedLookupState<DeliveryMethodLookupItem>;

/**
 * Query input structure for SKU dropdown or autocomplete lookups.
 *
 * Used to filter SKU options based on keyword and display preferences.
 * Typically passed into lookup endpoints that return { id, label } pairs.
 */
export interface SkuLookupQueryParams extends LookupQuery {
  /**
   * Whether to include barcode in the label output.
   * If true, the label will include both product name, SKU, and barcode
   * for clearer identification (e.g., in long lists or search results).
   */
  includeBarcode?: boolean;
}

/**
 * Represents a single enriched SKU result for lookup dropdowns.
 * Extends the generic LookupItem structure with SKU-specific flags.
 */
export interface SkuLookupItem extends LookupItem {
  /**
   * Indicates if the SKU passed all expected status checks (product, SKU, inventory, batch).
   */
  isNormal?: boolean;
  
  /**
   * List of reasons why the SKU failed validation (if `isNormal` is false).
   */
  issueReasons?: string[];
}

/**
 * API response format for SKU lookup queries.
 * Contains a list of SKU options with optional status flags and enrichment details.
 */
export type SkuLookupResponse = LookupSuccessResponse<SkuLookupItem>;

/**
 * Redux slice state for SKU lookup dropdowns or autocomplete inputs.
 *
 * Extends a generic paginated async lookup state to track:
 * - Matching SKU items (`SkuLookupItem[]`)
 * - Loading and error states for async requests
 * - Pagination info (`offset`, `limit`, `hasMore`)
 *
 * Typically used for rendering SKU search results with optional enrichment
 * (e.g., barcode, status flags) in forms or filter panels.
 */
export type SkuLookupState = PaginatedLookupState<SkuLookupItem>;
