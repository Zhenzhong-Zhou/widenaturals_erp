import type { InventoryHealthStatus, ItemType } from '../../inventoryShared/types/InventorySharedType.ts';
import type { PaginatedResponse, PaginatedState } from 'types/api';

export type LocationInventorySummaryResponse = PaginatedResponse<LocationInventorySummary>;

export interface LocationInventorySummary extends InventoryHealthStatus {
  id: string;
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