/**
 * @file pricing-types.ts
 * @description Type definitions for the pricing join list domain.
 *
 * Covers the paginated joined pricing read model (pricing + pricing type +
 * SKU + product), Redux state shape, filter/query params, and sort fields.
 */

import type {
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { NullableString } from '@shared-types/shared';
import type { ReduxPaginatedState } from '@shared-types/pagination';

// =============================================================================
// API Response Types
// =============================================================================

/** A single pricing record returned from the paginated pricing list API (joined view). */
export type PricingJoinRecord = {
  /** Unique identifier for the pricing record (UUID). */
  pricingId: string;
  /** UUID of the associated pricing group. */
  pricingGroupId: string;
  /** UUID of the associated pricing type. */
  pricingTypeId: string;
  /** Display name of the associated pricing type. */
  pricingTypeName: string;
  /** Code of the associated pricing type. */
  pricingTypeCode: string;
  /** Country code this pricing record applies to. */
  countryCode: string;
  /** Unit price for this record. */
  price: number;
  /** ISO date string from which this pricing record is valid. */
  validFrom: string;
  /** ISO date string until which this pricing record is valid, or null. */
  validTo: string | null;
  /** Current status of the pricing record. */
  status: GenericStatus;
  /** UUID of the associated SKU. */
  skuId: string;
  /** SKU code string. */
  sku: string;
  /** Barcode for the SKU. */
  barcode: string;
  /** Size label for the SKU. */
  sizeLabel: string;
  /** Country code the SKU is designated for. */
  skuCountryCode: string;
  /** UUID of the associated product. */
  productId: string;
  /** Name of the associated product. */
  productName: string;
  /** Brand of the associated product. */
  brand: string;
  /** Category of the associated product. */
  category: string;
  /** Display name combining product name and country. */
  displayName: string;
};

/** Paginated API response containing a list of joined pricing records. */
export type PaginatedPricingApiResponse = PaginatedResponse<PricingJoinRecord>;

// =============================================================================
// Flattened UI Types
// =============================================================================

/**
 * Flattened pricing record used in Redux state and table views.
 *
 * Derived from {@link PricingJoinRecord} by lifting nested status fields to the
 * top level. This is the canonical shape consumed by selectors, hooks, and
 * column configs throughout the pricing list UI.
 */
export interface FlattenedPricingJoinRecord {
  // -----------------------------
  // Pricing
  // -----------------------------
  
  /** Unique pricing record identifier */
  pricingId: string;
  
  /** Associated pricing group identifier */
  pricingGroupId: string;
  
  /** Unit price */
  price: number;
  
  /** ISO date string from which this pricing is valid */
  validFrom: string;
  
  /** ISO date string until which this pricing is valid (nullable) */
  validTo: NullableString;
  
  // -----------------------------
  // Pricing Type
  // -----------------------------
  
  /** Pricing type identifier */
  pricingTypeId: string;
  
  /** Pricing type display name */
  pricingTypeName: string;
  
  /** Pricing type code */
  pricingTypeCode: string;
  
  // -----------------------------
  // Geography
  // -----------------------------
  
  /** Country code this pricing applies to */
  countryCode: string;
  
  // -----------------------------
  // SKU
  // -----------------------------
  
  /** Associated SKU identifier */
  skuId: string;
  
  /** SKU code string */
  sku: string;
  
  /** SKU barcode */
  barcode: string;
  
  /** SKU size label */
  sizeLabel: string;
  
  /** Country code the SKU is designated for */
  skuCountryCode: string;
  
  // -----------------------------
  // Product
  // -----------------------------
  
  /** Associated product identifier */
  productId: string;
  
  /** Product name */
  productName: string;
  
  /** Product brand */
  brand: string;
  
  /** Product category */
  category: string;
  
  /** Display name combining product name and country */
  displayName: string;
  
  // -----------------------------
  // Status
  // -----------------------------
  
  /** Human-readable status name (e.g., "active", "inactive") */
  statusName: string;
  
  /** ISO timestamp representing when the status was last updated (nullable) */
  statusDate: NullableString;
}

// =============================================================================
// Paginated Response / Redux State
// =============================================================================

/**
 * Paginated UI response for the pricing list page.
 *
 * Returned by thunks after flattening API records.
 */
export type PaginatedPricingListUiResponse =
  PaginatedResponse<FlattenedPricingJoinRecord>;

/** Redux state shape for the pricing list slice. */
export type PricingListState = ReduxPaginatedState<FlattenedPricingJoinRecord>;

// =============================================================================
// Filters & Query Params
// =============================================================================

/** Filters available for querying the pricing join list. */
export type PricingFilters = {
  /** Filter by pricing group ID (UUID). */
  pricingGroupId?: string;
  /** Filter by pricing type ID (UUID). */
  pricingTypeId?: string;
  /** Filter by SKU ID (UUID). */
  skuId?: string;
  /** Filter by product ID (UUID). */
  productId?: string;
  /** Full-text search across pricing join fields. */
  search?: string;
  /** Filter by product brand. */
  brand?: string;
  /** Filter by product category. */
  category?: string;
  /** Filter by country code. */
  countryCode?: string;
};

/** Full query parameter shape for the pricing join list endpoint. */
export interface PricingQueryParams extends PaginationParams, SortConfig {
  filters?: PricingFilters;
}

// =============================================================================
// Sort Fields
// =============================================================================

/** Valid sort field keys for the pricing join list. */
export type PricingSortField =
  | 'productName'
  | 'brand'
  | 'category'
  | 'sku'
  | 'barcode'
  | 'sizeLabel'
  | 'skuCountryCode'
  | 'price'
  | 'countryCode'
  | 'validFrom'
  | 'validTo'
  | 'statusName'
  | 'defaultNaturalSort';

// =============================================================================
// Export Types
// =============================================================================

/** Filters available for the pricing export endpoint. */
export type PricingExportFilters = {
  /** Filter by pricing type ID (UUID). */
  pricingTypeId?: string;
  /** Filter by country code. */
  countryCode?: string;
  /** Filter by status ID (UUID). */
  statusId?: string;
  /** Filter by product brand. */
  brand?: string;
  /** Filter by product ID (UUID). */
  productId?: string;
};

/** Query parameter shape for the pricing export endpoint. */
export interface PricingExportQueryParams {
  filters?: PricingExportFilters;
  /** Export file format. Defaults to 'xlsx'. */
  exportFormat?: 'txt' | 'csv' | 'xlsx';
}
