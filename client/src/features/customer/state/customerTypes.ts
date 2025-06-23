import type { ApiSuccessResponse, MutationState } from '@shared-types/api';

// Represents a single customer creation request payload
export interface CustomerRequest {
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  region?: string;
  note?: string;
}

// Request payload, always an array (even for one customer)
export type CreateCustomersRequest = CustomerRequest[];

// Represents a sanitized/enriched customer returned by API
export interface CustomerResponse {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  status: {
    name: string;
  };
}

// Success wrapper for single customer creation
export type CreateSingleCustomerResponse = ApiSuccessResponse<CustomerResponse>;

// Success wrapper for bulk customer creation
export type CreateBulkCustomerResponse = ApiSuccessResponse<CustomerResponse[]>;

// Union type for dynamic response handling
export type CreateCustomerResponse =
  | CreateSingleCustomerResponse
  | CreateBulkCustomerResponse;


export type CustomerCreateState = MutationState<CustomerResponse[]>;

export interface CustomerQueryParams {
  page?: number; // Optional, defaults to 1
  limit?: number; // Optional, defaults to 10
  sortBy?: 'firstname' | 'lastname' | 'email' | 'created_at' | 'updated_at'; // Allowed fields
  sortOrder?: 'ASC' | 'DESC'; // Sorting direction
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
  customerName: string;
  email: string;
  phoneNumber: string | null;
  address: string;
  note: string | null;
  statusId: string;
  statusName: string;
  statusDate: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string;
}

export interface CustomerDetailsResponse {
  success: boolean;
  message: string;
  data: CustomerDetails;
}

// Represents a single customer dropdown option
export interface CustomerDropdownOption {
  id: string; // UUID of the customer
  label: string; // Formatted label (name, email, or phone based on search)
}

// Response type for fetching customers dropdown
export interface FetchCustomersDropdownResponse {
  success: boolean;
  data: CustomerDropdownOption[];
}
