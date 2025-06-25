import type {
  ApiSuccessResponse,
  CreateMode,
  MutationState,
  PaginatedResponse,
  PaginationParams, ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

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

/**
 * Alias of `CreateMode`, specifically for customer creation workflows.
 * This improves clarity in customer-specific components while reusing the shared type.
 */
export type CustomerCreateMode = CreateMode;

export interface CustomerListItem {
  id: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  statusId: string;
  statusName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type PaginatedCustomerListResponse = PaginatedResponse<CustomerListItem>;

export interface CustomerFilters {
  region?: string;
  country?: string;
  createdBy?: string;
  keyword?: string;
  createdAfter?: string;
  createdBefore?: string;
  statusDateAfter?: string;
  statusDateBefore?: string;
}

export interface FetchPaginatedCustomersParams extends PaginationParams, SortConfig {
  filters?: CustomerFilters;
}

export type PaginatedCustomerState = ReduxPaginatedState<CustomerListItem>;

export type CustomerSortField =
  | 'customerName'
  | 'email'
  | 'phoneNumber'
  | 'region'
  | 'country'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy';
