import { createAsyncThunk } from '@reduxjs/toolkit';
import type { CreateCustomersRequest, CreateCustomerResponse } from '../state/customerTypes';
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
