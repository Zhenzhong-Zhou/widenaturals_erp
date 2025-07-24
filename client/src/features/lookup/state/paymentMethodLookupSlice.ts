import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState, type PaymentMethodLookupItem,
  type PaymentMethodLookupResponse,
  type PaymentMethodLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchPaymentMethodLookup } from './lookupThunks';

const initialState: PaymentMethodLookupState = createInitialPaginatedLookupState<PaymentMethodLookupItem>();

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
      .addCase(fetchPaymentMethodLookup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaymentMethodLookup.fulfilled,
        (state, action: PayloadAction<PaymentMethodLookupResponse>) => {
          state.loading = false;
          state.error = null;
          state.data = action.payload.items;
          state.offset = (action.payload.offset ?? 0) + action.payload.items.length;
          state.limit = action.payload.limit;
          state.hasMore = action.payload.hasMore;
        }
      )
      .addCase(fetchPaymentMethodLookup.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to load payment methods';
      });
  },
});

export const { resetPaymentMethodLookup } = paymentMethodLookupSlice.actions;

export default paymentMethodLookupSlice.reducer;
