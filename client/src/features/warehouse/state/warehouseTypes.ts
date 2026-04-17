/**
 * @file warehouseTypes.ts
 *
 * Type definitions for the Warehouse domain.
 *
 * Covers API response shapes, filter/query parameters,
 * sort fields, and Redux state types.
 */

import {
  ApiSuccessResponse,
  GenericAudit,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
  AsyncState,
  CreatedUpdatedDateFilter,
  CreatedUpdatedByFilter,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';
import type { NullableNumber, NullableString } from '@shared-types/shared';

// =============================================================================
// Shared Sub-types
// =============================================================================

/** Inventory summary aggregated from active warehouse_inventory records. */
interface WarehouseInventorySummary {
  /** Number of active inventory batches in the warehouse. */
  totalBatches: number;
  /** Total units held across all active batches. */
  totalQuantity: number;
  /** Total units currently reserved against orders. */
  totalReserved: number;
  /** Units available for new reservations (totalQuantity - totalReserved). */
  availableQuantity: number;
}

/** Warehouse type reference. */
interface WarehouseType {
  id: string;
  name: string;
}

/** Warehouse status. */
interface WarehouseStatus {
  id: string;
  name: NullableString;
  date: NullableString;
}

// =============================================================================
// Core Record Types
// =============================================================================

/** Warehouse record returned by the paginated list endpoint. */
export interface WarehouseRecord {
  id: string;
  name: string;
  code: string;
  storageCapacity: NullableNumber;
  defaultFee: NullableNumber;
  isArchived: boolean;
  location: {
    id: string;
    name: string;
  };
  warehouseType: WarehouseType | null;
  status: WarehouseStatus;
  summary: WarehouseInventorySummary;
  audit: GenericAudit;
}

/** Full warehouse record returned by the detail endpoint. */
export interface WarehouseDetailRecord {
  id: string;
  name: string;
  code: string;
  storageCapacity: NullableNumber;
  defaultFee: NullableNumber;
  isArchived: boolean;
  notes: NullableString;
  location: {
    id: string;
    name: string;
    addressLine1: NullableString;
    addressLine2: NullableString;
    city: NullableString;
    provinceOrState: NullableString;
    postalCode: NullableString;
    country: NullableString;
    /** Pre-formatted address string for display. Null if all address fields are empty. */
    formattedAddress: NullableString;
    locationType: {
      id: string;
      name: string;
    } | null;
  };
  warehouseType: WarehouseType | null;
  status: WarehouseStatus;
  summary: WarehouseInventorySummary;
  audit: GenericAudit;
}

// =============================================================================
// API Response Types
// =============================================================================

export type PaginatedWarehouseListApiResponse = PaginatedResponse<WarehouseRecord>;

export type WarehouseDetailApiResponse = ApiSuccessResponse<WarehouseDetailRecord>;

// =============================================================================
// Filters
// =============================================================================

export type WarehouseFilters = CreatedUpdatedDateFilter & CreatedUpdatedByFilter & {
  statusId?: string;
  isArchived?: boolean;
  warehouseTypeId?: string;
  locationId?: string;
  name?: string;
  code?: string;
  keyword?: string;
};

// =============================================================================
// Query Params
// =============================================================================

export interface WarehouseQueryParams extends PaginationParams, SortConfig {
  filters?: WarehouseFilters;
}

// =============================================================================
// Sort Fields
// =============================================================================

export type WarehouseSortField =
  | 'warehouseName'
  | 'warehouseCode'
  | 'storageCapacity'
  | 'defaultFee'
  | 'isArchived'
  | 'warehouseTypeName'
  | 'locationName'
  | 'city'
  | 'provinceOrState'
  | 'country'
  | 'statusName'
  | 'statusId'
  | 'statusDate'
  | 'totalQuantity'
  | 'createdAt'
  | 'updatedAt'
  | 'createdByFirstName'
  | 'createdByLastName'
  | 'updatedByFirstName'
  | 'updatedByLastName'
  | 'defaultNaturalSort';

// =============================================================================
// Redux State
// =============================================================================

/** Paginated warehouse list slice state. */
export type PaginatedWarehouseListState = ReduxPaginatedState<WarehouseRecord>;

/** Warehouse detail slice state. */
export type WarehouseDetailState = AsyncState<WarehouseDetailRecord | null>;
