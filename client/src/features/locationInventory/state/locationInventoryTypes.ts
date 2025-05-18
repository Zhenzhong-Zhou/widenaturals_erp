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
  typeLabel: 'product' | 'packaging_material'; // Use 'material' to match transformed value
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