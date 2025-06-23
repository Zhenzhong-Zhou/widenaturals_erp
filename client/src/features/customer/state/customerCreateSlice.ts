import { createSlice } from '@reduxjs/toolkit';
import type { CustomerCreateState } from '../state/customerTypes';
import { createCustomersThunk } from './customerThunks';
import type {
  CreateCustomerResponse,
} from '../state/customerTypes';

const initialState: CustomerCreateState = {
  data: null,
  loading: false,
  error: null,
};

const customerCreateSlice = createSlice({
  name: 'customerCreate',
  initialState,
  reducers: {
    resetCustomerCreateState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(createCustomersThunk.fulfilled, (state, action) => {
        state.loading = false;
        
        const result = action.payload as CreateCustomerResponse;
        
        if (Array.isArray(result.data)) {
          // Bulk creation: result.data is CustomerResponse[]
          state.data = result.data;
        } else {
          // Single creation: result.data is CustomerResponse
          state.data = [result.data];
        }
      })
    .addCase(createCustomersThunk.rejected, (state, action) => {
      state.loading = false;
      state.error =
        (action.payload as Error)?.message || 'Failed to create customer(s)';
      state.data = null;
    });
  },
});

export const { resetCustomerCreateState } = customerCreateSlice.actions;
export default customerCreateSlice.reducer;
