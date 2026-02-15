import {
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import { ReduxPaginatedState } from '@shared-types/pagination';

/* ============================================================
   Address Structure
   ============================================================ */

/**
 * Represents a normalized geographic structure
 * attached to a location.
 */
export interface LocationAddress {
  city: string | null;
  provinceOrState: string | null;
  country: string | null;
}

/* ============================================================
   Core Domain Model
   ============================================================ */

/**
 * Canonical Location record returned by the API.
 * This structure should always mirror backend response.
 */
export interface LocationRecord {
  id: string;
  name: string;
  locationType: string;
  address: LocationAddress;
  isArchived: boolean;
  status: GenericStatus;
  audit: GenericAudit;
}

/* ============================================================
   UI Flattened Model (Derived)
   ============================================================ */

/**
 * Flattened version of LocationRecord for table rendering.
 * Should be generated via selector or transformer.
 * Never stored in Redux directly.
 */
export interface FlattenedLocationListRecord {
  id: string;
  name: string;
  locationType: string;

  city: string | null;
  provinceOrState: string | null;
  country: string | null;

  isArchived: boolean;

  statusName: string;
  statusDate: string;

  createdAt: string;
  updatedAt: string | null;

  createdByName: string;
  updatedByName: string | null;
}

/* ============================================================
   Sorting
   ============================================================ */

/**
 * Valid sort fields accepted by backend.
 * Must align with locationSortMap on server.
 */
export type LocationSortField =
  | 'name'
  | 'locationTypeName'
  | 'city'
  | 'provinceOrState'
  | 'country'
  | 'isArchived'
  | 'statusName'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'defaultNaturalSort';

/* ============================================================
   Filters
   ============================================================ */

/**
 * Filtering options supported by location list endpoint.
 */
export interface LocationListFilters {
  statusIds?: string | string[];
  locationTypeId?: string;

  city?: string;
  province_or_state?: string;
  country?: string;

  includeArchived?: boolean;

  createdBy?: string;
  updatedBy?: string;

  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;

  keyword?: string;
}

/* ============================================================
   Query Params
   ============================================================ */

/**
 * Complete query configuration for paginated location listing.
 */
export interface LocationListQueryParams extends PaginationParams, SortConfig {
  filters?: LocationListFilters;
}

/* ============================================================
   API Response Types
   ============================================================ */

/**
 * Raw paginated response returned from the backend.
 * Uses canonical LocationRecord structure.
 */
export type PaginatedLocationApiResponse = PaginatedResponse<LocationRecord>;

/* ============================================================
   Redux State Types
   ============================================================ */

/**
 * Redux paginated state for the location list.
 * Uses flattened row model optimized for UI rendering.
 *
 * This should be used inside locationSlice.
 */
export type PaginatedLocationState =
  ReduxPaginatedState<FlattenedLocationListRecord>;

/* ============================================================
   UI-Level Response Types
   ============================================================ */

/**
 * Paginated response shape consumed by UI components
 * after transformation (flattening).
 *
 * Typically returned from selector or hook.
 */
export type PaginatedLocationListUiResponse =
  PaginatedResponse<FlattenedLocationListRecord>;
