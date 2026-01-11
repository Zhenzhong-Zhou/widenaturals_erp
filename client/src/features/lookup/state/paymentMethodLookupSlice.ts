import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  PaymentMethodLookupItem,
  PaymentMethodLookupResponse,
  PaymentMethodLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchPaymentMethodLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: PaymentMethodLookupState =
  createInitialOffsetPaginatedState<PaymentMethodLookupItem>();

export const paymentMethodLookupSlice = createSlice({
  name: 'paymentMethodLookup',
  initialState,
  reducers: {
    /**
     * Resets the state to its initial value.
     */
    resetPaymentMethodLookup: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentMethodLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaymentMethodLookupThunk.fulfilled,
        (state, action: PayloadAction<PaymentMethodLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchPaymentMethodLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load payment methods';
      });
  },
});

export const { resetPaymentMethodLookup } = paymentMethodLookupSlice.actions;

export default paymentMethodLookupSlice.reducer;
