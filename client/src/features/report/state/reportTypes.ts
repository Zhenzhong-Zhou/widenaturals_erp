/**
 * Base interface for common report parameters.
 */
export interface BaseReportParams {
  exportFormat?: 'csv' | 'pdf' | 'txt' | null;
  reportType?: 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
  reportCategory?:
    | 'adjustment'
    | 'inventory_history'
    | 'inventory_activity'
    | null;
  startDate?: string | Date | null; // Accepts both string & Date
  endDate?: string | Date | null; // Accepts both string & Date
  timezone?: string; // Default: 'UTC'
  page?: number; // Pagination: Current Page
  limit?: number; // Pagination: Items per page
  totalRecords?: number; // Only in response, optional
  totalPages?: number; // Only in response, optional
}

// **Base interface for all reports**
export interface ReportBaseState<T> {
  data: T[]; // Generic data type for different reports
  exportData: Blob | null; // Stores exported file (CSV, PDF, TXT)
  exportFormat: 'csv' | 'pdf' | 'txt' | null; // Explicit export format types
  loading: boolean; // Loading state for paginated data
  exportLoading: boolean; // Loading state for exports
  error: string | null; // Error state for paginated data
  exportError: string | null; // Error state for exports
  pagination: ReportPagination; // Holds paginated response metadata
}

/**
 * Defines the parameters used for fetching an adjustment report.
 */
export interface AdjustmentReportParams extends BaseReportParams {
  warehouseId?: string | null; // Nullable warehouse ID
  inventoryId?: string | null; // Nullable inventory ID
  warehouseInventoryLotId?: string | null;
}

// Represents an individual adjustment record
export interface AdjustmentRecord {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_inventory_lot_id: string;
  inventory_id: string;
  item_name: string;
  lot_number: string;
  expiry_date: string;
  manufacture_date: string;
  previous_quantity: number;
  adjusted_quantity: number;
  new_quantity: number;
  adjustment_type: string;
  status: string;
  adjusted_by: string;
  comments: string | null;
  local_adjustment_date: string; // ISO date string
}

// Represents pagination details
export interface ReportPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// **Adjustment Report State (Extends ReportBaseState)**
export interface AdjustmentReportState
  extends ReportBaseState<AdjustmentRecord> {}

// Represents the response for a paginated adjustment report
export interface PaginatedAdjustmentReportResponse {
  success: boolean;
  message: string;
  data: AdjustmentRecord[];
  pagination: ReportPagination;
}

/**
 * Defines the parameters for fetching inventory activity logs.
 */
export interface InventoryActivityLogParams extends BaseReportParams {
  inventoryId?: string | null; // UUID or null
  warehouseId?: string | null; // UUID or null
  lotId?: string | null; // UUID or null
  orderId?: string | null; // UUID or null
  actionTypeId?: string | null; // UUID or null
  statusId?: string | null; // UUID or null
  userId?: string | null; // UUID or null
  sortBy?: string; // Default: 'timestamp'
  sortOrder?: 'ASC' | 'DESC'; // Default: 'DESC'
}

// Define the structure of each log entry
export interface InventoryActivityLog {
  log_id: string;
  product_id: string | null;
  item_name: string;
  inventory_id: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_inventory_lot_id: string | null;
  lot_number: string | null;
  expiry_date: string | null;
  manufacture_date: string | null;
  action_type: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  status: string;
  adjustment_type: string | null;
  order_id: string | null;
  user_name: string;
  local_timestamp: string;
  comments: string | null;
  metadata: Record<string, any> | null;
}

// **Inventory Activity Logs State (Extends ReportBaseState)**
export interface InventoryActivityLogsState
  extends ReportBaseState<InventoryActivityLog> {}

// Define the response format
export interface InventoryActivityLogsResponse {
  success: boolean;
  message: string;
  data: InventoryActivityLog[];
  pagination: ReportPagination;
}

export interface InventoryHistoryParams extends BaseReportParams {
  inventoryId?: string | null;
  warehouseId?: string | null;
  lotId?: string | null;
  orderId?: string | null;
  actionTypeId?: string | null;
  statusId?: string | null;
  userId?: string | null;
  userTimezone?: string; // User-defined timezone
  sortBy?:
    | 'timestamp'
    | 'new_quantity'
    | 'previous_quantity'
    | 'action_type'
    | 'status'
    | 'user';
  sortOrder?: 'ASC' | 'DESC';
}

// Define the structure for individual inventory history records
export interface InventoryHistoryRecord {
  log_id: string;
  inventory_id: string;
  product_id: string;
  item_name: string;
  inventory_action_type_id: string;
  action_type: string;
  previous_quantity: number;
  quantity_change: number;
  new_quantity: number;
  status_id: string;
  status: string;
  status_date: string;
  adjusted_timestamp: string; // Converted to user timezone
  source_action_id: string;
  source_user: string;
  comments?: string | null;
  metadata: Record<string, any>; // Additional metadata (e.g., batch info, source details)
  created_at: string;
  created_by: string;
}

// Define the API response structure
export interface InventoryHistoryResponse {
  success: boolean;
  message: string;
  data: InventoryHistoryRecord[];
  pagination: ReportPagination;
}

export interface InventoryHistoryState
  extends ReportBaseState<InventoryHistoryRecord> {}
