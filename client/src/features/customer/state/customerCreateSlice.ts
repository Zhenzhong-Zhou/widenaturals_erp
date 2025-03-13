import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  createCustomerThunk,
  createBulkCustomersThunk,
} from './customerThunks';
import { BulkCustomerResponse, CustomerResponse } from './customerTypes';

interface CustomerState {
  customers: CustomerResponse[]; // Stores created customers
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  error: null,
};

const customerCreateSlice = createSlice({
  name: 'customersCreate',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Single customer creation
      .addCase(createCustomerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createCustomerThunk.fulfilled,
        (state, action: PayloadAction<BulkCustomerResponse>) => {
          state.loading = false;
          state.customers = [...state.customers, ...action.payload.customers]; // Add newly created customer
        }
      )
      .addCase(createCustomerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create customer.';
      })

      // Bulk customer creation
      .addCase(createBulkCustomersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createBulkCustomersThunk.fulfilled,
        (state, action: PayloadAction<BulkCustomerResponse>) => {
          state.loading = false;
          state.customers = [...state.customers, ...action.payload.customers]; // Add bulk-created customers
        }
      )
      .addCase(createBulkCustomersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create bulk customers.';
      });
  },
});

export default customerCreateSlice.reducer;
