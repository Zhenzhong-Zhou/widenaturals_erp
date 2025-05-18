import type { InventoryHealthStatus } from 'types/InventoryHealthStatus';
import type { PaginatedResponse, PaginatedState } from 'types/api';

// Interface for a single inventory item
export interface InventoryItem {
  inventoryId: string;
  itemType: string;
  productId: string;
  itemName: string;
  locationId: string;
  warehouseId: string | null;
  placeName: string;
  inboundDate: string | null;
  outboundDate: string | null;
  lastUpdate: string | null;
  statusId: string;
  statusName: string;
  statusDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string;
  warehouseFee: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalLotQuantity: number;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
  displayStatus: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  isLowStock: boolean;
  stockLevel: 'none' | 'critical' | 'low' | 'normal';
  expirySeverity:
    | 'expired'
    | 'expired_soon'
    | 'critical'
    | 'warning'
    | 'notice'
    | 'safe'
    | 'unknown';
}

// Pagination Interface
export interface AllInventoriesPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// API Response Interface for Inventory
export interface InventoryResponse {
  success: boolean;
  message: string;
  data: InventoryItem[];
  pagination: AllInventoriesPagination;
}

export type LocationInventorySummaryResponse = PaginatedResponse<LocationInventorySummary>;

export interface LocationInventorySummary extends InventoryHealthStatus {
  id: string;
  locationId: string;
  locationName: string;
  batchId: string;
  batchType: 'product' | 'packaging_material';
  lotNumber: string;
  manufactureDate: string; // ISO timestamp
  expiryDate: string;      // ISO timestamp
  typeLabel: 'product' | 'material';
  displayName: string;
  sku: string | null;
  barcode: string | null;
  product: string | null;
  material: MaterialDetails | null;
  quantity: QuantityDetails;
  status: InventoryStatus;
  inboundDate: string;
  outboundDate: string | null;
}

export interface MaterialDetails {
  name: string;
  code: string;
  unit: string;
  composition: string;
  partName: string;
  partType: string;
}

export interface QuantityDetails {
  location: number;
  reserved: number;
}

export interface InventoryStatus {
  id: string;
  name: string;
  date: string;
}

export interface LocationInventoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  
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