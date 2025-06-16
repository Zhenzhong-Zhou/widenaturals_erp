import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
} from '@shared-types/api.ts';

export interface InventoryActivityLogEntry {
  id: string;
  actionTimestamp: string;
  actionType: string;
  adjustmentType?: string;
  status: string;
  performedBy: string;
  order: {
    number: string | null;
    type: string | null;
    status: string | null;
  };
  source: {
    type: string;
    refId: string | null;
  };
  quantity: {
    previous: number;
    change: number;
    new: number;
  };
  comments: string;
  metadata: {
    source: string;
    inventory_scope?: string;
  };
  batchType: 'product' | 'packaging_material';
  locationName: string;
  warehouseName: string;
  
  // Conditional data
  productInfo?: {
    sku: string;
    productName: string;
    brand: string;
    category: string;
  };
  packagingMaterialInfo?: {
    lotNumber: string;
    snapshotName: string;
    receivedLabelName: string;
    quantity: string;
    unit: string;
  };
}

export type InventoryActivityLogBaseDataResponse = ApiSuccessResponse<InventoryActivityLogEntry[]>;

export type InventoryActivityLogPaginatedResponse = PaginatedResponse<InventoryActivityLogEntry>;

export interface InventoryActivityLogQueryParams extends PaginationParams {
  warehouseIds?: string[];         // array of warehouse UUIDs
  locationIds?: string[];          // array of location UUIDs
  productIds?: string[];           // array of product UUIDs
  skuIds?: string[];               // array of SKU UUIDs
  batchIds?: string[];             // array of batch UUIDs
  packingMaterialIds?: string[];   // array of packaging material UUIDs
  actionTypeIds?: string[];        // array of action type IDs or keys
  
  orderId?: string | null;         // single order UUID
  statusId?: string | null;        // single status UUID
  adjustmentTypeId?: string | null;// single adjustment type UUID
  performedBy?: string | null;     // user ID or name
  sourceType?: string | null;      // enum/string (e.g. 'manual_insert')
  batchType?: string | null;       // 'product' | 'packaging_material'
  
  fromDate?: string | null;        // ISO 8601 date string
  toDate?: string | null;          // ISO 8601 date string
}

export interface InventoryActivityLogsState {
  /**
   * Non-paginated log data (used in base views).
   */
  base: AsyncState<InventoryActivityLogEntry[]>;
  
  /**
   * Paginated log data (used in privileged views with filters).
   */
  paginated: ReduxPaginatedState<InventoryActivityLogEntry>;
}
