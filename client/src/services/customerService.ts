import { BulkCustomerRequest, BulkCustomerResponse } from '../features/customer';
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

export const customerService = {
  createCustomer,
  createBulkCustomers,
}