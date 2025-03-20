import { createSlice } from '@reduxjs/toolkit';
import { CustomerDropdownOption } from './customerTypes.ts';
import { fetchCustomersForDropdownThunk } from './customerThunks.ts';

interface CustomerDropdownState {
  data: CustomerDropdownOption[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomerDropdownState = {
  data: [],
  loading: false,
  error: null,
};

const customerDropdownSlice = createSlice({
  name: 'customerDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersForDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomersForDropdownThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchCustomersForDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch customers.';
      });
  },
});

export default customerDropdownSlice.reducer;
