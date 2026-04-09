/**
 * @file pricing-type-types.ts
 * @description Type definitions for pricing type list management,
 * including API response shapes, query parameters, filters, and Redux state.
 */

import type {
  ApiSuccessResponse,
  AsyncState,
  CreatedUpdatedByFilter,
  CreatedUpdatedDateFilter,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

/** A single pricing type record as returned by the API. */
export type PricingTypeRecord = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  status: GenericStatus;
  audit: GenericAudit;
};

/** Paginated API response containing a list of pricing type records. */
export type PaginatedPricingTypeApiResponse =
  PaginatedResponse<PricingTypeRecord>;

/** Filters available for querying the pricing type list. */
export type PricingTypeFilters = {
  /** Full-text search across name, code, and slug. */
  search?: string;
  /** Filter by status ID (UUID). */
  statusId?: string;
} & CreatedUpdatedByFilter
  & Pick<CreatedUpdatedDateFilter, 'createdAfter' | 'createdBefore'>;

/** Full query parameter shape for the pricing type list endpoint. */
export interface PricingTypeQueryParams extends PaginationParams, SortConfig {
  filters?: PricingTypeFilters;
}

/** Valid sort field keys for the pricing type list. */
export type PricingTypeSortField =
  | 'pricingTypeName'
  | 'pricingTypeCode'
  | 'pricingTypeSlug'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'statusName'
  | 'defaultNaturalSort';

/** Redux slice state shape for the paginated pricing type list. */
export type PricingTypeState = ReduxPaginatedState<PricingTypeRecord>;

/** A single pricing type record as returned by the detail API endpoint. */
export type PricingTypeDetailRecord = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  status: GenericStatus;
  audit: GenericAudit;
};

/** API response for a single pricing type detail. */
export type PricingTypeDetailApiResponse = ApiSuccessResponse<PricingTypeDetailRecord>;

/** Redux slice state shape for the pricing type detail view. */
export type PricingTypeDetailState = AsyncState<PricingTypeDetailRecord | null>;
