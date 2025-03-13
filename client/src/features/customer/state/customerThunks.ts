import { createAsyncThunk } from "@reduxjs/toolkit";
import { customerService } from '../../../services';
import { BulkCustomerRequest, BulkCustomerResponse } from './customerTypes.ts';

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
