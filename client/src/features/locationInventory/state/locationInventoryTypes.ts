import type { InventoryHealthStatus, ItemType } from '@features/inventoryShared/types/InventorySharedType';
import type { PaginatedResponse, PaginatedState } from '@shared-types/api';

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

export interface LocationInventorySummaryItemDetail {
  locationInventoryId: string;
  item: (
    | {
    id: string;
    code: string;
  }
    | {
    id: string;
    code: string;
  }
    );
  lotNumber: string;
  manufactureDate: string; // ISO date string
  expiryDate: string;      // ISO date string
  quantity: {
    locationQuantity: number;
    reserved: number;
    available: number;
  };
  status: {
    id: string;
    name: string;
    date: string; // ISO date string
  };
  timestamps: {
    inboundDate?: string;
    outboundDate?: string;
    lastUpdate: string;
  };
  durationInStorage: number;
  location: {
    id: string;
    name: string;
    type: string;
  };
}

export type LocationInventorySummaryDetailResponse = PaginatedResponse<LocationInventorySummaryItemDetail>;

export type LocationInventorySummaryDetailState = PaginatedState<LocationInventorySummaryItemDetail>;