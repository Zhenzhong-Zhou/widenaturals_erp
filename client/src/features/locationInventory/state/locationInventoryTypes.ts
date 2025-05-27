import type {
  BaseFlatInventoryRow,
  BaseInventorySummaryItem,
  InventoryHealthStatus,
  ItemType,
} from '@features/inventoryShared/types/InventorySharedType';
import type {
  ApiSuccessResponse,
  AsyncDataState,
  PaginatedResponse,
  PaginatedState,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';

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

export interface LocationInventoryFilters {
  batchType?: 'product' | 'packaging_material';
  locationName?: string;
  
  // Product-related
  productName?: string;
  sku?: string;
  
  // Material-related
  materialName?: string;
  materialCode?: string;
  
  // Part-related
  partName?: string;
  partCode?: string;
  partType?: string;
  
  // Common
  lotNumber?: string;
  status?: string;
  inboundDate?: string; // yyyy-mm-dd
  expiryDate?: string;  // yyyy-mm-dd
  createdAt?: string;   // yyyy-mm-dd
}

export interface LocationInventoryQueryParams extends LocationInventoryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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

export interface FetchLocationInventoryArgs {
  pagination: PaginationParams;
  filters: LocationInventoryFilters;
  sortConfig?: SortConfig;
}

export interface LocationInventoryRecord {
  id: string;
  itemType: 'product' | 'packaging_material';
  location: {
    id: string;
    name: string;
    type: string;
  };
  quantity: {
    locationQuantity: number;
    available: number;
    reserved: number;
  };
  lot: {
    number: string;
    manufactureDate: string | null;
    expiryDate: string | null;
  };
  product?: {
    name: string;
    brand?: string;
    sku?: string;
    barcode?: string;
    countryCode?: string;
    language?: string;
    sizeLabel?: string;
    manufacturer?: string;
  };
  material?: {
    name: string;
    received_name: string;
    code: string;
    color?: string | null;
    size?: string | null;
    unit: string;
    supplier?: string;
  };
  part?: {
    name: string;
    code: string;
    type: string;
    unit: string;
  };
  createdBy: string | null;
  updatedBy?: string | null;
  status: {
    name: string;
    stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
    expirySeverity: 'normal' | 'expired' | 'expired_soon' | string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string | null;
    inboundDate: string;
    outboundDate: string | null;
    lastUpdate: string;
  };
  display: {
    name: string;
  };
}

export type LocationInventoryRecordsResponse = PaginatedResponse<LocationInventoryRecord>;


export type LocationInventoryState = PaginatedState<LocationInventoryRecord>;

export interface FlatLocationInventoryRow {
  id: string;
  lotNumber: string;
  name: string;
  locationQuantity: number;
  available: number;
  reserved: number;
  status: string;
  stockLevel: string;
  expirySeverity: string;
  expiryDate: string;
  lastUpdate: string;
  isGroupHeader?: boolean;
  originalRecord: LocationInventoryRecord;
}
