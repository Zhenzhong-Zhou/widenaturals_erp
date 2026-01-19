import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { HealthApiResponse, HealthUiState } from '@features/systemHealth';
import { fetchSystemHealthThunk } from './systemHealthThunk';

const initialState: HealthUiState = {
  data: null,
  loading: false,
  error: null,
};

const systemHealthSlice = createSlice({
  name: 'systemHealth',
  initialState,
  reducers: {
    resetSystemHealth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // -------------------------------
      // Pending
      // -------------------------------
      .addCase(fetchSystemHealthThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      // -------------------------------
      // Fulfilled
      // -------------------------------
      .addCase(fetchSystemHealthThunk.fulfilled, (state, action: PayloadAction<HealthApiResponse>) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      
      // -------------------------------
      // Rejected
      // -------------------------------
      .addCase(fetchSystemHealthThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload ?? 'Failed to fetch system health status';
      });
  },
});

export const { resetSystemHealth } = systemHealthSlice.actions;
export default systemHealthSlice.reducer;
