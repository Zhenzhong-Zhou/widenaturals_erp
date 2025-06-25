import { createAsyncThunk } from '@reduxjs/toolkit';
import type { CreateCustomersRequest, CreateCustomerResponse, PaginatedCustomerListResponse, FetchPaginatedCustomersParams } from '../state/customerTypes';
import { customerService } from '@services/customerService';

/**
 * Thunk to create one or more customers via API.
 *
 * - Accepts an array of customer objects.
 * - Returns either a single or multiple customer creation response.
 * - Automatically handles API and dispatch lifecycle using Redux Toolkit.
 *
 * @param {CreateCustomersRequest} customers - Array of customers to create.
 * @returns {CreateCustomerResponse} - API response containing created customer(s).
 */
export const createCustomersThunk = createAsyncThunk<
  CreateCustomerResponse,
  CreateCustomersRequest
>('customers/create', async (customers, thunkAPI) => {
  try {
    return await customerService.createCustomers(customers);
  } catch (error) {
    console.error('Thunk error in createCustomersThunk', error);
    return thunkAPI.rejectWithValue(error);
  }
});

/**
 * Thunk to fetch paginated customer data with optional filters and sorting.
 *
 * Dispatch this thunk with:
 * - pagination info (page, limit)
 * - sort config (sortBy, sortOrder)
 * - filters (region, country, keyword, etc.)
 *
 * @example
 * dispatch(fetchPaginatedCustomersThunk({ page: 1, limit: 20, filters: { region: 'CA' } }))
 */
export const fetchPaginatedCustomersThunk = createAsyncThunk<
  PaginatedCustomerListResponse,         // Return type
  FetchPaginatedCustomersParams,         // Arg type
  { rejectValue: string }                // Error handling
>(
  'customers/fetchPaginated',
  async (params, { rejectWithValue }) => {
    try {
      return await customerService.fetchPaginatedCustomers(params);
    } catch (error: any) {
      console.error('Thunk fetch error:', error);
      return rejectWithValue(error.message ?? 'Failed to fetch customers');
    }
  }
);
