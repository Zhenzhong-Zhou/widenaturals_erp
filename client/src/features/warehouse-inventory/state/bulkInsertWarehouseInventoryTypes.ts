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

export interface BulkInsertInventoryResponse {
  success: boolean;
  message: string;
  data: {
    inventoryRecords: InventoryRecord[];
    warehouseInventoryRecords: InventoryRecord[];
    warehouseLotsInventoryRecords: InventoryRecord[];
  };
}
