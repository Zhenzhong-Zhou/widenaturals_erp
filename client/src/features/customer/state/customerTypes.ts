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
