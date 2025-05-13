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
