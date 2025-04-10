import { createSlice } from '@reduxjs/toolkit';
import { fetchPriceValueThunk, PriceState } from '@features/pricing';

const initialState: PriceState = {
  priceData: null,
  loading: false,
  error: null,
};

const priceValueSlice = createSlice({
  name: 'pricingValue',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceValueThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceValueThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.priceData = action.payload;
      })
      .addCase(fetchPriceValueThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default priceValueSlice.reducer;
