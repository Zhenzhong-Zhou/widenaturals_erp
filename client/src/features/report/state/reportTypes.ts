/**
 * Defines the parameters used for fetching an adjustment report.
 */
export interface AdjustmentReportParams {
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  userTimezone: string;
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  inventoryId?: string;
  page?: number;
  limit?: number;
  totalRecords: number;
  totalPages: number;
  exportFormat?: 'csv' | 'pdf' | 'txt';
}

// Represents an individual adjustment record
export interface AdjustmentRecord {
  local_adjustment_date: string; // ISO date string
  warehouse_id: string;
  warehouse_name: string;
  item_name: string;
  inventory_id: string;
  previous_quantity: number;
  adjusted_quantity: number;
  new_quantity: number;
  adjustment_type: string;
  status: string;
  adjusted_by: string;
  comments: string | null;
}

// Represents pagination details
export interface ReportPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface ReportState {
  data: AdjustmentRecord[];
  loading: boolean;
  error: string | null;
  pagination: ReportPagination;
}

// Represents the response for a paginated adjustment report
export interface PaginatedAdjustmentReportResponse {
  success: boolean;
  message: string;
  data: AdjustmentRecord[];
  pagination: ReportPagination;
}

// Represents the response for exported reports (CSV, PDF, TXT)
export interface FileExportResponse {
  fileBuffer: ArrayBuffer; // More generic binary format
  contentType: string;
  fileName: string;
}