import type { PaginationParams } from '../../../types/api';

export interface InventoryHealthStatus {
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
  expirySeverity: 'expired' | 'expired_soon' | 'critical' | 'warning' | 'notice' | 'safe' | 'unknown';
}

export type ItemType = 'product' | 'packaging_material' | undefined;


/**
 * Interface for fetching inventory summary details by item ID with pagination.
 *
 * Can be used for both warehouse and location inventory queries depending on the context.
 */
export interface InventorySummaryDetailByItemIdParams extends PaginationParams {
  /**
   * The ID of the SKU or material to query inventory for.
   */
  itemId: string;
}