import type {
  BaseFlatInventoryRow,
  BaseInventoryFilters,
  BaseInventoryRecord,
  BaseInventorySummaryItem,
  BaseInventoryTableProps,
  FlatInventoryRowBase,
  InventoryHealthStatus,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

export type LocationInventorySummaryResponse =
  PaginatedResponse<LocationInventorySummary>;

export interface LocationInventorySummary extends InventoryHealthStatus {
  itemId: string;
  itemType: ItemType; // Use 'material' to match transformed value
  displayName: string;
  totalLots: number;
  totalLotQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
  createdAt: string;
}

export interface LocationInventoryFilters extends BaseInventoryFilters {
  locationName?: string;
}

export interface LocationInventoryQueryParams extends LocationInventoryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export type LocationInventorySummaryState =
  ReduxPaginatedState<LocationInventorySummary>;

export interface LocationInventorySummaryItemDetail extends BaseInventorySummaryItem {
  locationInventoryId: string;
  quantity: BaseInventorySummaryItem['quantity'] & {
    locationQuantity: number;
  };
  location: {
    id: string;
    name: string;
    type: string;
  };
}

export type LocationInventorySummaryDetailResponse =
  PaginatedResponse<LocationInventorySummaryItemDetail>;

export type LocationInventorySummaryDetailState =
  ReduxPaginatedState<LocationInventorySummaryItemDetail>;

export interface FlatLocationInventorySummaryDetailRow extends BaseFlatInventoryRow {
  locationInventoryId: string;
  locationQuantity: number;
  locationName: string;
  locationType: string;
}

export interface LocationInventoryKpiSummaryItem {
  batchType: 'product' | 'packaging_material' | 'total';
  totalProducts: number;
  totalMaterials: number;
  locationsCount: number;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  nearExpiryInventoryRecords: number;
  expiredInventoryRecords: number;
  expiredProductBatches: number;
  expiredMaterialBatches: number;
  lowStockCount: number;
}

export type LocationInventoryKpiSummaryResponse = ApiSuccessResponse<
  LocationInventoryKpiSummaryItem[]
>;

/**
 * State slice for KPI summary in location inventory.
 */
export type LocationInventoryKpiSummaryState = AsyncState<
  LocationInventoryKpiSummaryItem[]
>;

export interface FetchLocationInventoryArgs {
  pagination: PaginationParams;
  filters: LocationInventoryFilters;
  sortConfig?: SortConfig;
}

export interface LocationInventoryRecord extends BaseInventoryRecord {
  warehouse: {
    id: string;
  };

  location: {
    id: string;
    name: string;
    type: string;
  };

  quantity: BaseInventoryRecord['quantity'] & {
    locationQuantity: number;
  };
}

export type LocationInventoryRecordsResponse =
  PaginatedResponse<LocationInventoryRecord>;

export type LocationInventoryState =
  ReduxPaginatedState<LocationInventoryRecord>;

export interface FlatLocationInventoryRow extends FlatInventoryRowBase<LocationInventoryRecord> {}

export type LocationInventoryTableProps = BaseInventoryTableProps<
  LocationInventoryRecord,
  FlatLocationInventoryRow
>;
