import type {
  BaseFlatInventoryRow,
  BaseInventorySummaryItem,
  InventoryHealthStatus,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import type { ApiSuccessResponse, AsyncDataState, PaginatedResponse, PaginatedState } from '@shared-types/api';

export type LocationInventorySummaryResponse = PaginatedResponse<LocationInventorySummary>;

export interface LocationInventorySummary extends InventoryHealthStatus {
  itemId: string;
  typeLabel: ItemType; // Use 'material' to match transformed value
  displayName: string;
  totalLots: number;
  totalLotQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
  createdAt: string;
}

export interface LocationInventoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  
  batchType?: 'product' | 'packaging_material';
  productName?: string;
  lotNumber?: string;
  sku?: string;
  materialName?: string;
  inboundDate?: string;   // ISO date or range (e.g., '2024-01-01')
  expiryDate?: string;    // ISO date or range
  status?: string;
  createdAt?: string;     // ISO string or timestamp
  locationId?: string;
}

export type LocationInventorySummaryState = PaginatedState<LocationInventorySummary>

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

export type LocationInventorySummaryDetailResponse = PaginatedResponse<LocationInventorySummaryItemDetail>;

export type LocationInventorySummaryDetailState = PaginatedState<LocationInventorySummaryItemDetail>;

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

export type LocationInventoryKpiSummaryResponse = ApiSuccessResponse<LocationInventoryKpiSummaryItem[]>;

/**
 * State slice for KPI summary in location inventory.
 */
export type LocationInventoryKpiSummaryState = AsyncDataState<LocationInventoryKpiSummaryItem[]>;
