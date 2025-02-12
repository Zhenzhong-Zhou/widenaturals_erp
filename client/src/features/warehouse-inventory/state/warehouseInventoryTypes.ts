export interface WarehouseInventory {
  warehouse_inventory_id: string;
  warehouse_id: string;
  warehouse_name: string;
  storage_capacity: number;
  location_name: string;
  product_id: string;
  product_name: string;
  reserved_quantity: number;
  warehouse_fee: string;
  last_update: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface WarehouseInventoryResponse {
  success: boolean;
  message: string;
  inventories: WarehouseInventory[];
  pagination: Pagination;
}

export interface WarehouseInventorySummary {
  warehouseId: string;
  warehouseName: string;
  status: string;
  totalProducts: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalWarehouseFees: number;
  lastInventoryUpdate: string; // ISO Date String
  totalLots: number;
  earliestExpiry: string; // ISO Date String
  latestExpiry: string; // ISO Date String
  totalZeroStockLots: number;
}

export interface WarehouseInventorySummaryResponse {
  success: boolean;
  message: string;
  formattedSummary: WarehouseInventorySummary[];
  pagination: Pagination;
}

// Interface for a single product summary in a warehouse
export interface WarehouseProductSummary {
  productId: string;
  productName: string;
  totalLots: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalZeroStockLots: number;
  earliestExpiry: string | null; // Can be null if no expiry date is set
  latestExpiry: string | null;
}


// Interface for the full API response
export interface WarehouseProductSummaryResponse {
  success: boolean;
  message: string;
  productSummaryData: WarehouseProductSummary[];
  pagination: Pagination;
}

export interface InventoryCreatedUpdatedInfo {
  date: string;
  by: string;
}

export interface WarehouseInventoryDetail {
  warehouseInventoryId: string;
  productId: string;
  productName: string;
  warehouseInventoryLotId: string;
  lotNumber: string;
  lotQuantity: number;
  reservedStock: number;
  warehouseFees: string;
  lotStatus: string;
  manufactureDate: string;
  expiryDate: string;
  inboundDate: string;
  outboundDate: string | null;
  lastUpdate: string;
  inventoryCreated: InventoryCreatedUpdatedInfo;
  inventoryUpdated: InventoryCreatedUpdatedInfo;
  lotCreated: InventoryCreatedUpdatedInfo;
  lotUpdated: InventoryCreatedUpdatedInfo;
}

export interface WarehouseInventoryDetailExtended extends WarehouseInventoryDetail {
  lotCreatedBy: string;
  lotCreatedDate: string;
  lotUpdatedBy: string;
  lotUpdatedDate: string;
}

export interface WarehouseInventoryDetailsResponse {
  success: boolean;
  message: string;
  inventoryDetails: WarehouseInventoryDetail[];
  pagination: Pagination;
}

// Interface for Warehouse Lot Adjustment Type
export interface LotAdjustmentType {
  id: string;
  name: string;
}

// Type for an array of Lot Adjustment Types
export type LotAdjustmentTypeList = LotAdjustmentType[];

export interface LotAdjustmentSinglePayload {
  adjustment_type_id: string; // UUID of the adjustment type
  adjusted_quantity: number; // Change in quantity (+ or -)
  comments?: string; // Optional comment for adjustment
}

export type BulkLotAdjustmentPayload = Array<{
  warehouse_inventory_id: string;
  adjustment_type_id: string;
  adjusted_quantity: number;
  comments: string;
}>;

export interface LotAdjustmentQtyState {
  loadingSingle: boolean;
  loadingBulk: boolean;
  errorSingle: string | null;
  errorBulk: string | null;
  successSingle: boolean;
  successBulk: boolean;
}
