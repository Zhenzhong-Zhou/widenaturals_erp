export interface Warehouse {
  id: string;
  name: string;
  storageCapacity: number;
  location: string;
}

export interface InventoryItem {
  id: string;
  itemType: string;
  itemName: string;
}

export interface QuantityInfo {
  reserved: number;
  lotReserved: number;
  available: number;
  totalLot: number;
  inStock: number;
}

export interface FeesInfo {
  warehouseFee: number;
}

export interface DatesInfo {
  lastUpdate: string | null;
  displayStatusDate: string | null;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
}

export interface StatusInfo {
  display: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  isLowStock: boolean;
  stockLevel: 'none' | 'critical' | 'low' | 'normal';
  expirySeverity: 'unknown' | 'expired' | 'expired_soon' | 'critical' | 'warning' | 'notice' | 'safe';
  displayNote: string;
}

export interface AuditInfo {
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string;
}

export interface WarehouseInventory {
  warehouseInventoryId: string;
  warehouse: Warehouse;
  inventory: InventoryItem;
  quantity: QuantityInfo;
  fees: FeesInfo;
  dates: DatesInfo;
  status: StatusInfo;
  audit: AuditInfo;
}

export interface WarehouseInventoryPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface WarehouseInventoryResponse {
  success: boolean;
  message: string;
  data: WarehouseInventory[];
  pagination: WarehouseInventoryPagination;
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
  pagination: WarehouseInventoryPagination;
}

// Interface for a single item summary in a warehouse
export interface WarehouseItemSummary {
  inventoryId: string;
  itemName: string;
  itemType: string;
  totalLots: number;
  totalReservedStock: number;
  totalLotReservedStock: number;
  totalAvailableStock: number;
  totalQtyStock: number;
  totalZeroStockLots: number;
  earliestExpiry: string | null;
  latestExpiry: string | null;
}

export interface FetchWarehouseItemSummaryParams {
  warehouseId: string;
  itemSummaryPage: number;
  itemSummaryLimit: number;
}

// Interface for the full API response
export interface WarehouseItemSummaryResponse {
  success: boolean;
  message: string;
  itemSummaryData: WarehouseItemSummary[];
  pagination: WarehouseInventoryPagination;
}

export interface InventoryCreatedUpdatedInfo {
  date: string | null;
  by: string;
}

interface InventoryIndicatorsFlat {
  isExpired: boolean;
  isNearExpiry: boolean;
  isLowStock: boolean;
  stockLevel: 'none' | 'critical' | 'low' | 'normal';
  expirySeverity:
    | 'unknown'
    | 'expired'
    | 'expired_soon'
    | 'critical'
    | 'warning'
    | 'notice'
    | 'safe';
}

export interface WarehouseInventoryDetail {
  warehouseInventoryId: string;
  inventoryId: string;
  itemName: string;
  itemType: string;
  warehouseInventoryLotId: string;
  lotNumber: string;
  lotReserved: number;
  lotQuantity: number;
  reservedStock: number;
  availableStock: number;
  warehouseFees: number; // updated from string
  lotStatus: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  inboundDate: string | null;
  outboundDate: string | null;
  lastUpdate: string | null;
  inventoryCreated: InventoryCreatedUpdatedInfo;
  inventoryUpdated: InventoryCreatedUpdatedInfo;
  lotCreated: InventoryCreatedUpdatedInfo;
  lotUpdated: InventoryCreatedUpdatedInfo;
  indicators: InventoryIndicatorsFlat;
}

export interface WarehouseInventoryDetailExtended
  extends WarehouseInventoryDetail {
  lotCreatedBy: string;
  lotCreatedDate: string | null;
  lotUpdatedBy: string;
  lotUpdatedDate: string | null;
  indicators_isExpired: boolean;
  indicators_isNearExpiry: boolean;
  indicators_isLowStock: boolean;
  indicators_stockLevel: 'none' | 'critical' | 'low' | 'normal';
  indicators_expirySeverity: InventoryIndicatorsFlat['expirySeverity'];
}

export interface WarehouseInventoryDetailsResponse {
  success: boolean;
  message: string;
  inventoryDetails: WarehouseInventoryDetail[];
  pagination: WarehouseInventoryPagination;
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
  reserved_quantity: number;
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
  warehouseLotId: string;
  inventoryId: string;
  locationId: string;
  productName: string;
  lotNumber: string;
  lotQuantity: number;
  inventoryQuantity: number;
  availableQuantity: number;
  lotReservedQuantity: number;
  insertedQuantity: number;
  manufactureDate: string | null;
  expiryDate: string | null;
  inboundDate: string;
  audit: AuditInfo;
}

// Interface for Warehouse Inventory Data
export interface WarehouseInventoryData {
  warehouseId: string;
  warehouseName: string;
  totalRecords: number;
  inventoryRecords: InventoryRecordInsertResponse[];
}

// Response Type
export interface WarehouseInventoryInsertResponse {
  success: boolean;
  data: WarehouseInventoryData[];
}
