import {
  BulkCustomerRequest,
  BulkCustomerResponse,
  CustomerListResponse,
  CustomerQueryParams,
} from '../features/customer';
import axiosInstance from "../utils/axiosConfig";
import { API_ENDPOINTS } from './apiEndponits.ts';

// Generic post function for reducing redundancy
const postRequest = async <T, R>(url: string, data: T): Promise<R> => {
  const response = await axiosInstance.post<R>(url, data);
  return response.data;
};

// Create a single customer
const createCustomer = (customer: BulkCustomerRequest): Promise<BulkCustomerResponse> =>
  postRequest<BulkCustomerRequest, BulkCustomerResponse>(API_ENDPOINTS.ADD_NEW_CUSTOMER, customer);

// Create multiple customers
const createBulkCustomers = (customers: BulkCustomerRequest): Promise<BulkCustomerResponse> =>
  postRequest<BulkCustomerRequest, BulkCustomerResponse>(API_ENDPOINTS.ADD_NEW_CUSTOMERS_BULK, customers);

/**
 * Fetch paginated customer data with sorting.
 *
 * @param {CustomerQueryParams} params - Query parameters (pagination, sorting)
 * @returns {Promise<CustomerListResponse>} - API response containing customer data
 */
export const fetchCustomers = async (
  params: CustomerQueryParams = { page: 1, limit: 10, sortBy: "created_at", sortOrder: "DESC" }
): Promise<CustomerListResponse> => {
  const response = await axiosInstance.get<CustomerListResponse>(
    API_ENDPOINTS.ALL_CUSTOMERS,
    { params }
  );
  return response.data;
};

export const customerService = {
  createCustomer,
  createBulkCustomers,
  fetchCustomers,
}