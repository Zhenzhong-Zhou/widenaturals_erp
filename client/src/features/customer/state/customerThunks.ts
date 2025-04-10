import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  BulkCustomerRequest,
  BulkCustomerResponse, CustomerDetails,
  CustomerDetailsResponse,
  CustomerListResponse,
  CustomerQueryParams, FetchCustomersDropdownResponse,
} from '@features/customer';
import { customerService } from '@services/customerService.ts';
import { dropdownService } from '@services/dropdownService.ts';

// Thunk for creating a single customer
export const createCustomerThunk = createAsyncThunk<
  BulkCustomerResponse,
  BulkCustomerRequest,
  { rejectValue: string }
>('customers/createCustomer', async (customer, { rejectWithValue }) => {
  try {
    return await customerService.createCustomer(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return rejectWithValue('Failed to create customer.');
  }
});

// Thunk for creating multiple customers
export const createBulkCustomersThunk = createAsyncThunk<
  BulkCustomerResponse,
  BulkCustomerRequest,
  { rejectValue: string }
>('customers/createBulkCustomers', async (customers, { rejectWithValue }) => {
  try {
    return await customerService.createBulkCustomers(customers);
  } catch (error) {
    console.error('Error creating bulk customers:', error);
    return rejectWithValue('Failed to create bulk customers.');
  }
});

export const fetchCustomersThunk = createAsyncThunk<
  CustomerListResponse, // Expected return type
  CustomerQueryParams, // Input parameters
  { rejectValue: string } // Error handling
>('customers/fetchCustomers', async (params, { rejectWithValue }) => {
  try {
    return await customerService.fetchCustomers(params);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return rejectWithValue('Failed to fetch customers.');
  }
});

export const fetchCustomerByIdThunk = createAsyncThunk<
  CustomerDetails, // Return only CustomerDetails
  string, // Argument type (customer ID)
  { rejectValue: string }
>('customer/fetchById', async (customerId, { rejectWithValue }) => {
  try {
    const response: CustomerDetailsResponse =
      await customerService.fetchCustomerDetailsById(customerId);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return rejectWithValue('Failed to fetch customer details.');
  }
});

/**
 * Thunk to fetch customers for dropdown.
 */
export const fetchCustomersForDropdownThunk = createAsyncThunk<
  FetchCustomersDropdownResponse, // Return type
  { search?: string; limit?: number }, // Payload type
  { rejectValue: string } // Rejected action type
>(
  'customers/fetchDropdown',
  async ({ search = '', limit = 100 }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchCustomersForDropdown(search, limit);
    } catch (error) {
      return rejectWithValue('Failed to fetch customers.');
    }
  }
);
