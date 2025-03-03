/**
 * Defines the parameters used for fetching an adjustment report.
 */
export interface AdjustmentReportParams {
  exportFormat?: 'csv' | 'pdf' | 'txt' | null;
  reportType: 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
  userTimezone: string;
  startDate?: string | Date | null; // Accepts both string & Date
  endDate?: string | Date | null; // Accepts both string & Date
  warehouseId?: string | null; // Nullable warehouse ID
  inventoryId?: string | null; // Nullable inventory ID
  warehouseInventoryLotId?: string | null;
  page?: number; // Pagination: Current Page
  limit?: number; // Pagination: Items per page
  totalRecords?: number; // Only in response, optional
  totalPages?: number; // Only in response, optional
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

export interface ReportState {
  data: AdjustmentRecord[]; // Holds paginated report data
  exportData: Blob | null; // Stores exported file (CSV, PDF, TXT)
  exportFormat: 'csv' | 'pdf' | 'txt' | null; // Explicit export format types
  loading: boolean; // Loading state for paginated data
  exportLoading: boolean; // Loading state for exports
  error: string | null; // Error state for paginated data
  exportError: string | null; // Error state for exports
  pagination: ReportPagination; // Holds paginated response metadata
}

// Represents the response for a paginated adjustment report
export interface PaginatedAdjustmentReportResponse {
  success: boolean;
  message: string;
  data: AdjustmentRecord[];
  pagination: ReportPagination;
}
