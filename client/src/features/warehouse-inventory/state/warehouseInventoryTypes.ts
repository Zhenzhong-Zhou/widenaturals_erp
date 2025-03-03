export interface WarehouseInventory {
  warehouseInventoryId: string;
  warehouseId: string;
  warehouseName: string;
  storageCapacity: number;
  locationName: string;
  inventoryId: string;
  itemType: string;
  itemName: string;
  availableQuantity: number;
  reservedQuantity: number;
  warehouseFee: string;
  lastUpdate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
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
  totalQuantity: number;
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
  inventoryId: string;
  productName: string;
  itemType: string;
  identifier: string;
  totalLots: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalQtyStock: number;
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
  date: string | null;
  by: string;
}

export interface WarehouseInventoryDetail {
  warehouseInventoryId: string;
  inventoryId: string;
  itemName: string;
  itemType: string;
  warehouseInventoryLotId: string;
  lotNumber: string;
  lotQuantity: number;
  reservedStock: number;
  availableStock: number;
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

export interface WarehouseInventoryDetailExtended
  extends WarehouseInventoryDetail {
  lotCreatedBy: string;
  lotCreatedDate: string | null;
  lotUpdatedBy: string;
  lotUpdatedDate: string | null;
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

export interface ProductDropdownItem {
  product_id: string;
  product_name: string;
  warehouse_id?: string;
}

export interface WarehouseDropdownItem {
  id: string;
  name: string;
}

export interface DropdownState {
  products: ProductDropdownItem[];
  warehouses: WarehouseDropdownItem[];
  loading: boolean;
  error: string | null;
}

// Request Data Interface
export interface InventoryItem {
  type: 'product' | 'raw_material' | 'packaging_material' | 'sample';
  product_id?: string; // Only for 'product' type
  identifier?: string; // Only for non-product types
  warehouse_id: string;
  quantity: number;
  lot_number: string;
  expiry_date: string;
  manufacture_date?: string; // Only for 'product' type
}

// Request Body Interface
export interface BulkInsertInventoryRequest {
  inventoryData: InventoryItem[];
}

// Response Data Interfaces
export interface InventoryRecord {
  id: string;
}

export interface InventoryRecord {
  id: string;
}

export interface BulkInsertInventoryData {
  warehouseLotsInventoryRecords: InventoryRecord[];
}

export interface BulkInsertInventoryResponse {
  success: boolean;
  message: string;
  data: BulkInsertInventoryData;
}

// Request Body Type
export interface WarehouseLotId {
  id: string;
}

export interface InsertInventoryRequestBody {
  warehouseLotIds: WarehouseLotId[];
}

// Interface for Inventory Record
export interface InventoryRecordInsertResponse {
  warehouse_lot_id: string;
  inventory_id: string;
  location_id: string;
  quantity: number;
  product_name: string;
  identifier: string;
  inserted_quantity: number;
  available_quantity: number;
  lot_number: string;
  expiry_date: string | null; // Nullable ISO Date String
  manufacture_date: string | null; // Nullable ISO Date String
  inbound_date: string; // ISO Date String
  inventory_created_at: string; // ISO Date String
  inventory_created_by: string;
  inventory_updated_at: string; // ISO Date String
  inventory_updated_by: string;
}

// Interface for Warehouse Inventory Data
export interface WarehouseInventoryData {
  warehouse_id: string;
  warehouse_name: string;
  total_records: string;
  inventory_records: InventoryRecordInsertResponse[];
}

// Response Type
export interface WarehouseInventoryInsertResponse {
  success: boolean;
  data: WarehouseInventoryData[];
}
