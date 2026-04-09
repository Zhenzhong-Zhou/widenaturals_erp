/**
 * @fileoverview Customer domain types for Redux state, API payloads,
 * and paginated list views.
 *
 * These types mirror the shapes produced by the customer transformer
 * and consumed by customer components and Redux slices.
 */

import type {
  ApiSuccessResponse,
  MutationState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

/** Raw request payload for creating a single customer. */
export interface CustomerRequest {
  customer_type: string;
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
  /** Required when customer_type is 'company', otherwise null. */
  company_name: string | null;
  note?: string;
}

/** Request payload — always an array, even for a single customer. */
export type CreateCustomersRequest = CustomerRequest[];

/**
 * Enriched customer shape returned by the API after creation.
 * Mirrors the nested transformer output from transformCustomerRow.
 */
export interface CustomerResponse {
  id: string;
  customerType: string;
  /** Null for company-type customers. */
  firstname: string | null;
  /** Null for company-type customers. */
  lastname: string | null;
  /** Null for individual-type customers. */
  companyName: string | null;
  email: string;
  phoneNumber: string | null;
  status: {
    name: string;
    date: string;
  };
}

/** Success wrapper for single customer creation. */
export type CreateSingleCustomerResponse = ApiSuccessResponse<CustomerResponse>;

/** Success wrapper for bulk customer creation. */
export type CreateBulkCustomerResponse = ApiSuccessResponse<CustomerResponse[]>;

/** Union type for dynamic single vs bulk response handling. */
export type CreateCustomerResponse =
  | CreateSingleCustomerResponse
  | CreateBulkCustomerResponse;

/** Redux mutation state for customer create operations. */
export type CustomerCreateState = MutationState<CustomerResponse[]>;

/**
 * Flat customer shape used in paginated table views.
 * Mirrors the flat transformer output from transformCustomerRow({ format: 'flat' }).
 *
 * customerName is pre-resolved by the transformer:
 * - company type: resolves to companyName
 * - individual type: resolves to firstname + lastname
 */
export interface CustomerListItem {
  id: string;
  customerType: string;
  customerName: string | null;
  email: string | null;
  phoneNumber: string | null;
  statusId: string | null;
  statusName: string | null;
  statusDate: string | null;
  hasAddress: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Paginated API response for the customer list view. */
export type PaginatedCustomerListResponse = PaginatedResponse<CustomerListItem>;

/** Query filters accepted by the paginated customer list endpoint. */
export interface CustomerFilters {
  createdBy?: string;
  keyword?: string;
  /** Filter by customer type — 'individual' or 'company'. */
  customerType?: string;
  /** Searches across firstname, lastname, and company_name. */
  customerName?: string;
  createdAfter?: string;
  createdBefore?: string;
  statusDateAfter?: string;
  statusDateBefore?: string;
  onlyWithAddress?: boolean;
}

/** Parameters for fetching a paginated, sorted, filtered customer list. */
export interface FetchPaginatedCustomersParams
  extends PaginationParams,
    SortConfig {
  filters?: CustomerFilters;
}

/** Redux paginated state for the customer list. */
export type PaginatedCustomerState = ReduxPaginatedState<CustomerListItem>;

/** Valid sort fields for the customer list table. */
export type CustomerSortField =
  | 'customerName'
  | 'email'
  | 'phoneNumber'
  | 'status'
  | 'hasAddress'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy';
