import { createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../../services';
import {
  BulkCustomerRequest,
  BulkCustomerResponse,
  CustomerListResponse,
  CustomerQueryParams,
} from './customerTypes.ts';

// Thunk for creating a single customer
export const createCustomerThunk = createAsyncThunk<
  BulkCustomerResponse,
  BulkCustomerRequest,
  { rejectValue: string }
>(
  "customers/createCustomer",
  async (customer, { rejectWithValue }) => {
    try {
      return await customerService.createCustomer(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      return rejectWithValue("Failed to create customer.");
    }
  }
);

// Thunk for creating multiple customers
export const createBulkCustomersThunk = createAsyncThunk<
  BulkCustomerResponse,
  BulkCustomerRequest,
  { rejectValue: string }
>(
  "customers/createBulkCustomers",
  async (customers, { rejectWithValue }) => {
    try {
      return await customerService.createBulkCustomers(customers);
    } catch (error) {
      console.error("Error creating bulk customers:", error);
      return rejectWithValue("Failed to create bulk customers.");
    }
  }
);

export const fetchCustomersThunk = createAsyncThunk<
  CustomerListResponse,  // Expected return type
  CustomerQueryParams,   // Input parameters
  { rejectValue: string } // Error handling
>(
  "customers/fetchCustomers",
  async (params, { rejectWithValue }) => {
    try {
      return await customerService.fetchCustomers(params);
    } catch (error) {
      console.error("Error fetching customers:", error);
      return rejectWithValue("Failed to fetch customers.");
    }
  }
);
