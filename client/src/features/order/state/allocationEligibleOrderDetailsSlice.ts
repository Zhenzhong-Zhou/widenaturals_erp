import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchAllocationEligibleOrderDetailsThunk } from '@features/order';
import type { AllocationEligibleOrderDetails } from '@features/order/state/orderTypes';

interface AllocationEligibleOrderDetailsState {
  data: AllocationEligibleOrderDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: AllocationEligibleOrderDetailsState = {
  data: null,
  loading: false,
  error: null,
};

const allocationEligibleOrderDetailsSlice = createSlice({
  name: 'allocationEligibleOrderDetails',
  initialState,
  reducers: {
    resetAllocationEligibleOrderDetailsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllocationEligibleOrderDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllocationEligibleOrderDetailsThunk.fulfilled,
        (
          state,
          action: PayloadAction<{ data: AllocationEligibleOrderDetails }>
        ) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(
        fetchAllocationEligibleOrderDetailsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ||
            'Failed to fetch allocation-eligible order details';
        }
      );
  },
});

export const { resetAllocationEligibleOrderDetailsState } =
  allocationEligibleOrderDetailsSlice.actions;

export default allocationEligibleOrderDetailsSlice.reducer;
