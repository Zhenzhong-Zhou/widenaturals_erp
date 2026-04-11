/**
 * @file pricing-group-types.ts
 * @description Type definitions for the pricing group domain, including
 * API response shapes, filter parameters, sort fields, and Redux state.
 */

import type {
  CreatedUpdatedByFilter,
  CreatedUpdatedDateFilter,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import { ReduxPaginatedState } from '@shared-types/pagination';

/** A single pricing group record returned from the API. */
export type PricingGroupRecord = {
  /** Unique identifier for the pricing group (UUID). */
  id: string;
  /** UUID of the associated pricing type. */
  pricingTypeId: string;
  /** Display name of the associated pricing type. */
  pricingTypeName: string;
  /** Code of the associated pricing type. */
  pricingTypeCode: string;
  /** Country code this pricing group applies to, or 'GLOBAL'. */
  countryCode: string;
  /** Unit price for this pricing group. */
  price: number;
  /** ISO date string from which this pricing group is valid. */
  validFrom: string;
  /** ISO date string until which this pricing group is valid. */
  validTo: string;
  /** Current status of the pricing group. */
  status: GenericStatus;
  /** Audit metadata for the pricing group. */
  audit: GenericAudit;
  /** Number of SKUs associated with this pricing group. */
  skuCount: number;
  /** Number of products associated with this pricing group. */
  productCount: number;
};

/** Paginated API response containing a list of pricing group records. */
export type PaginatedPricingGroupApiResponse =
  PaginatedResponse<PricingGroupRecord>;

/** Filters available for querying the pricing group list. */
export type PricingGroupFilters = {
  /** Full-text search across pricing group fields. */
  keyword?: string;
  /** Filter by pricing type ID (UUID). */
  pricingTypeId?: string;
  /** Filter by status ID (UUID). */
  statusId?: string;
  /** Filter by country code (e.g. 'CA', 'US', 'GLOBAL'). */
  countryCode?: string;
  /** Minimum price (inclusive). */
  priceMin?: number;
  /** Maximum price (inclusive). */
  priceMax?: number;
  /** Filter groups with a valid_from on or after this ISO date. */
  validFrom?: string;
  /** Filter groups with a valid_to on or before this ISO date. */
  validTo?: string;
  /** Filter groups that are valid on this specific ISO date. */
  validOn?: string;
  /** Filter by associated SKU ID (UUID). */
  skuId?: string;
  /** Filter by associated product ID (UUID). */
  productId?: string;
  /** When true, returns only groups where today falls within valid_from–valid_to. */
  currentlyValid?: boolean;
} & CreatedUpdatedByFilter
  & Pick<CreatedUpdatedDateFilter, 'createdAfter' | 'createdBefore'>;

/** Full query parameter shape for the pricing group list endpoint. */
export interface PricingGroupQueryParams extends PaginationParams, SortConfig {
  filters?: PricingGroupFilters;
}

/** Valid sort field keys for the pricing group list. */
export type PricingGroupSortField =
  | 'pricingTypeName'
  | 'pricingTypeCode'
  | 'countryCode'
  | 'price'
  | 'validFrom'
  | 'statusName'
  | 'skuCount'
  | 'productCount'
  | 'updatedAt'
  | 'defaultNaturalSort';

/** Redux slice state shape for the paginated pricing group list. */
export type PricingGroupState = ReduxPaginatedState<PricingGroupRecord>;
