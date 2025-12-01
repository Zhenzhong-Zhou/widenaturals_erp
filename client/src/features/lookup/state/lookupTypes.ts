import type {
  ApiSuccessResponse,
  AsyncState,
  LookupPagination,
  LookupSuccessResponse,
  PaginatedLookupState,
  PaginationLookupInfo,
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
  keyword: string;
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
export const createInitialPaginatedLookupState = <
  T,
>(): PaginatedLookupState<T> => ({
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
 * Represents a single order type item for use in dropdowns or autocomplete components.
 *
 * Produced by transforming raw `order_types` table rows into a UI-friendly format.
 * Some fields may only be present if the current user has sufficient access permissions.
 *
 * @property {boolean} isRequiredPayment - Whether this order type requires payment.
 * @property {boolean} [isActive] - True if the order type is active; may be omitted based on access control.
 * @property {string} [category] - Optional category or grouping label for this order type.
 */
export interface OrderTypeLookupItem extends LookupItemWithStatus {
  isRequiredPayment: boolean;
  category?: string;
}

/**
 * API response type for order type lookup.
 *
 * Wraps an array of `OrderTypeLookupItem` in a standard API success response.
 */
export type OrderTypeLookupResponse = ApiSuccessResponse<OrderTypeLookupItem[]>;

/**
 * Async state shape used in store or hook for tracking order type lookup state.
 *
 * Includes loading, error, and data fields representing an array of `OrderTypeLookupItem`.
 */
export type OrderTypeLookupState = AsyncState<OrderTypeLookupItem[]>;

/**
 * Query parameters for fetching payment method lookup results.
 * This is a direct alias of LookupQuery and cannot be extended further.
 */
export type PaymentMethodLookupQueryParams = LookupQuery;

/**
 * A single payment method item returned from the API lookup.
 *
 * Extends the standard lookup item structure of `{ id, label }` with:
 * - `isActive`: Whether the payment method is currently active.
 */
export type PaymentMethodLookupItem = LookupItemWithStatus;

/**
 * Response structure for the payment method lookup endpoint.
 *
 * Wraps a paginated array of `PaymentMethodLookupItem` and includes
 * lookup-specific pagination metadata.
 */
export type PaymentMethodLookupResponse =
  LookupSuccessResponse<PaymentMethodLookupItem>;

/**
 * Redux state for payment method lookup results.
 * Includes async and pagination metadata for infinite-scroll or paginated dropdowns.
 */
export type PaymentMethodLookupState =
  PaginatedLookupState<PaymentMethodLookupItem>;

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
export type DeliveryMethodLookupResponse =
  LookupSuccessResponse<DeliveryMethodLookupItem>;

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
export type DeliveryMethodLookupState =
  PaginatedLookupState<DeliveryMethodLookupItem>;

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

/**
 * Query parameters for paginated pricing lookup results.
 *
 * Used to filter and control the structure of returned pricing records.
 * Supports keyword search, pagination, SKU-based filtering, and simplified label-only formatting.
 */
export interface PricingLookupQueryParams extends LookupQuery {
  /**
   * Optional SKU ID to filter pricing results.
   * If provided, only pricing records related to the specified SKU will be returned.
   */
  skuId?: string | null;

  /**
   * If true, the response will include only minimal fields: `id`, `label`, and optional flags
   * (e.g., `isActive`, `isValidToday`) based on user access.
   *
   * This is useful for performance-optimized lookups (e.g., dropdowns).
   */
  labelOnly?: boolean;
}

/**
 * Represents a detailed pricing lookup result with full metadata.
 *
 * Returned when `labelOnly` is `false`. Includes location name, price, and pricing type name.
 * Also inherits `id`, `label`, and optional `isActive`/`isValidToday` from `LookupItemWithStatus`.
 */
export interface PricingLookupFullItem extends LookupItemWithStatus {
  /**
   * Location where the price is applicable.
   * Optional based on user access and response options.
   */
  locationName?: string;

  /**
   * Price value for the SKU or product, as a string or number.
   */
  price: string | number;

  /**
   * Pricing type name (e.g., "Wholesale", "Retail").
   */
  pricingTypeName: string;
}

/**
 * Represents a minimal pricing lookup result, typically returned when `labelOnly` is `true`.
 *
 * Includes only `id`, `label`, and optionally `isActive`/`isValidToday`
 * depending on user permission.
 */
export type PricingLookupLabelOnlyItem = LookupItemWithStatus;

/**
 * Union type representing a pricing lookup result.
 *
 * The result may be a minimal item (`PricingLookupLabelOnlyItem`) or
 * a full item (`PricingLookupFullItem`) depending on display options and user access.
 */
export type PricingLookupItem =
  | PricingLookupFullItem
  | PricingLookupLabelOnlyItem;

/**
 * API response type for pricing lookup endpoints.
 *
 * This wraps the pricing lookup items in a standard paginated lookup response format.
 * The `items` array may include either full or label-only pricing records,
 * depending on the provided query options and user access level.
 *
 * @example Successful response (labelOnly = false):
 * {
 *   success: true,
 *   message: "Successfully retrieved pricing lookup",
 *   offset: 0,
 *   limit: 50,
 *   hasMore: true,
 *   items: [
 *     {
 *       id: "uuid",
 *       label: "Focus (SKU123) · Wholesale · $19.99",
 *       locationName: "Main Warehouse",
 *       price: "19.99",
 *       pricingTypeName: "Wholesale",
 *       isActive: true,
 *       isValidToday: true
 *     }
 *   ]
 * }
 *
 * @example Successful response (labelOnly = true):
 * {
 *   success: true,
 *   message: "Successfully retrieved pricing lookup",
 *   offset: 0,
 *   limit: 50,
 *   hasMore: false,
 *   items: [
 *     {
 *       id: "uuid",
 *       label: "Wholesale · $19.99",
 *       isActive: true
 *     }
 *   ]
 * }
 */
export type PricingLookupResponse = LookupSuccessResponse<PricingLookupItem>;

/**
 * Redux slice state for pricing lookup dropdowns or autocomplete inputs.
 *
 * Extends a generic paginated async lookup state to track:
 * - Matching pricing items (`PricingLookupItem[]`)
 * - Loading and error states for async requests
 * - Pagination info (`offset`, `limit`, `hasMore`)
 *
 * Typically used for rendering pricing options in sales order forms,
 * discount selectors, or inventory pricing filters. Supports both
 * full and label-only pricing entries depending on access level and display mode.
 */
export type PricingLookupState = PaginatedLookupState<PricingLookupItem>;

/**
 * Represents a full lookup bundle with results, loading/error states, pagination metadata,
 * and control functions (`fetch` and `reset`). Used for dropdowns and lookup components.
 *
 * @template TParams - The shape of the query parameters used for fetching lookup data.
 *
 * @property options - The available dropdown options returned from the lookup.
 * @property loading - Indicates whether the lookup is currently fetching data.
 * @property error - Holds an error message (if any) from the lookup request.
 * @property meta - Optional pagination metadata (e.g. limit, offset, total count).
 * @property fetch - Function to trigger the lookup with optional query parameters.
 * @property reset - Function to reset the lookup state (e.g. clear results or errors).
 */
export type LookupBundle<TParams> = {
  options: LookupOption[];
  loading: boolean;
  error: string | null;
  meta?: PaginationLookupInfo;
  fetch: (params?: TParams) => void;
  reset: () => void;
};

/**
 * Represents the state for a paginated dropdown component.
 *
 * Typically used to control and reflect:
 * - the current text input (`inputValue`) from the user,
 * - the current query parameters (`fetchParams`) being used for API requests.
 *
 * @template TParams - The shape of the query parameters (e.g., keyword, limit, offset).
 *
 * @property inputValue - The current value typed into the dropdown search input.
 * @property fetchParams - The current query parameters used for fetching paginated results.
 */
export interface PaginatedDropdownState<TParams> {
  inputValue: string;
  fetchParams: TParams;
}

/**
 * Query parameters for fetching packaging-material lookup results.
 * Extends `LookupQuery` with a top-level `mode` that the server normalizer
 * whitelists and places into `options.mode`.
 */
export type PackagingMaterialLookupQueryParams = LookupQuery & {
  /** Enables stricter server-side rules for the sales dropdown */
  mode?: 'generic' | 'salesDropdown';
};

/**
 * A packaging-material option for dropdowns/lookups.
 *
 * Shape matches your transformer:
 * - Always includes `{ id, label }` where `label` is built via
 *   `formatPackagingMaterialLabel(name — size • color • unit)`.
 * - May include status flags when access allows.
 *
 * Notes:
 * - `isArchived` is included **only** if the user can view all statuses; otherwise omitted.
 */
export type PackagingMaterialOnlyLookupItem = LookupItemWithStatus & {
  isArchived?: boolean;
};

/**
 * Response shape for packaging-material lookup.
 * Reuses the app-wide paginated lookup response type.
 */
export type PackagingMaterialLookupResponse =
  LookupSuccessResponse<PackagingMaterialOnlyLookupItem>;

/**
 * Redux slice state for packaging-material lookup dropdowns or autocomplete inputs.
 *
 * Extends the generic paginated async lookup state to track:
 * - Matching items (`PackagingMaterialOnlyLookupItem[]`)
 * - Loading and error states for async requests
 * - Pagination info (`offset`, `limit`, `hasMore`)
 *
 * Commonly used in sales order packaging selectors (including salesDropdown mode)
 * and internal inventory/procurement UIs. Items are label-only by default; optional
 * flags such as `isActive` / `isArchived` may be included based on access level.
 */
export type PackagingMaterialLookupState =
  PaginatedLookupState<PackagingMaterialOnlyLookupItem>;

/**
 * Represents an individual SKU Code Base lookup item returned from the server.
 *
 * Extends `LookupItem` with optional status flags (`isActive`, `isValidToday`)
 * to support UI dropdown filtering and status indicators.
 */
export interface SkuCodeBaseLookupItem extends LookupItemWithStatus {
  /** Parsed SKU Code Base components */
  brand_code: string;
  category_code: string;
}

/**
 * Response shape for SKU Code Base lookup requests.
 *
 * Wraps the paginated lookup payload inside the standard
 * `LookupSuccessResponse<T>` envelope, containing:
 * - `items: SkuCodeBaseLookupItem[]`
 * - `limit`, `offset`, `hasMore`
 * - `success: true`
 * - `message`
 */
export type SkuCodeBaseLookupResponse =
  LookupSuccessResponse<SkuCodeBaseLookupItem>;

/**
 * Query parameters for fetching SKU Code Base lookup items.
 *
 * Extends the generic `LookupQuery` (keyword, limit, offset)
 * by adding SKU Code Base–specific filters:
 *
 * - `brand_code` — Optional exact brand code filter
 * - `category_code` — Optional exact category code filter
 *
 * These map directly to server-side filters for `GET /lookups/sku-code-bases`.
 */
export interface SkuCodeBaseLookupParams extends LookupQuery {
  brand_code?: string;
  category_code?: string;
}

/**
 * Redux state type for SKU Code Base lookup data.
 *
 * Combines:
 * - `AsyncState<T[]>` (loading/error/data)
 * - Pagination metadata (`limit`, `offset`, `hasMore`)
 *
 * Used by `skuCodeBaseLookupSlice`.
 */
export type SkuCodeBaseLookupState =
  PaginatedLookupState<SkuCodeBaseLookupItem>;

/**
 * Represents a Product lookup item.
 *
 * Used in contexts where a lightweight product reference is needed
 * (dropdowns, autocomplete during SKU creation, BOM flows, order pages, etc.).
 *
 * Supports UI flags such as:
 * - `isActive`
 * - `isValidToday`
 */
export type ProductLookupItem = LookupItemWithStatus;

/**
 * Response shape for Product lookup requests.
 *
 * Wraps product lookup results inside the standard
 * paginated `LookupSuccessResponse<T>` payload.
 */
export type ProductLookupResponse =
  LookupSuccessResponse<ProductLookupItem>;

/**
 * Nested filters object for product lookup queries.
 *
 * These filter fields are optional substring/fuzzy matches:
 * - `brand` — product brand
 * - `category` — product category
 * - `series` — product series (e.g. “Immune”, “Heart Health”)
 *
 * These map directly to `buildProductFilter` on the backend.
 */
export interface ProductLookupFilters {
  brand?: string;
  category?: string;
  series?: string;
}

/**
 * Query parameters for fetching Product lookup items.
 *
 * Extends:
 * - `LookupQuery` (keyword, limit, offset)
 *
 * Adds nested:
 * - `filters` — {@link ProductLookupFilters}
 *
 * This structure matches the server’s `/lookups/products` expectations.
 */
export interface ProductLookupParams extends LookupQuery {
  filters?: ProductLookupFilters;
}

/**
 * Redux state type for Product lookup data.
 *
 * Combines:
 * - Asynchronous state (loading, error, data[])
 * - Pagination metadata (limit, offset, hasMore)
 *
 * Used by `productLookupSlice`.
 */
export type ProductLookupState =
  PaginatedLookupState<ProductLookupItem>;

/**
 * Represents a Status lookup item.
 *
 * This is the lightweight form used in dropdowns,
 * autocomplete inputs, filter panels, and configuration UIs.
 *
 * Supports UI flags such as:
 * - `isActive` — mapped from boolean `is_active` on server
 */
export interface StatusLookupItem {
  id: string;
  label: string; // usually the status name (e.g. "Active", "Suspended")
  isActive: boolean;
}

/**
 * Response shape for Status lookup requests.
 *
 * Wraps lookup results inside the standard
 * paginated `LookupSuccessResponse<T>` payload.
 */
export type StatusLookupResponse =
  LookupSuccessResponse<StatusLookupItem>;

/**
 * Query parameters for fetching Status lookup items.
 *
 * Extends:
 * - `LookupQuery` (keyword, limit, offset)
 *
 * Adds nested:

 *
 * This shape matches the server’s `/lookups/statuses` expectations.
 */
export type StatusLookupParams = LookupQuery;

/**
 * Redux state type for Status lookup data.
 *
 * Combines:
 * - async loading/error state
 * - paginated metadata (limit, offset, hasMore)
 * - lookup items
 *
 * Used by `statusLookupSlice` or any equivalent hook/state store.
 */
export type StatusLookupState =
  PaginatedLookupState<StatusLookupItem>;

/**
 * Status lookup option returned by the status lookup API.
 *
 * Extends the generic `LookupOption` type with SKU-specific
 * business information. Used by status dropdowns, pagination lists,
 * and any lookup-based selection components.
 *
 * @property isActive - Indicates whether this status represents an active SKU
 *                      in business logic (e.g., ACTIVE vs DISCONTINUED).
 */
export interface StatusLookupOption extends LookupOption {
  /** Whether this status is considered active in business logic. */
  isActive: boolean;
}
