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
