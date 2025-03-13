export interface CustomerRequest {
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
  address: string;
  note?: string; // Optional field
}

// Bulk request type (array of customers)
export type BulkCustomerRequest = CustomerRequest[];

export interface CustomerResponse {
  id: string;
}

export interface BulkCustomerResponse {
  success: boolean;
  message: string;
  customers: CustomerResponse[];
}

export interface CustomerQueryParams {
  page?: number; // Optional, defaults to 1
  limit?: number; // Optional, defaults to 10
  sortBy?: "firstname" | "lastname" | "email" | "created_at" | "updated_at"; // Allowed fields
  sortOrder?: "ASC" | "DESC"; // Sorting direction
}

export interface Customer {
  id: string;
  customer_name: string;
  email: string;
  phone_number: string | null; // Can be null if missing
  status_id: string;
  status_name: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface CustomerListResponse {
  success: boolean;
  message: string;
  data: Customer[];
  pagination: CustomerPagination;
}

export interface CustomerDetails {
  id: string;
  customer_name: string;
  email: string;
  phone_number: string;
  address: string;
  note?: string;
  status_id: string;
  status_name: string;
  status_date: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string;
}

export interface CustomerDetailsResponse {
  success: boolean;
  message: string;
  data: CustomerDetails;
}
