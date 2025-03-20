import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTaxRateDropdownThunk } from './taxRateThunks';
import { TaxRateDropdownItem } from './taxRateTypes';

interface TaxRateState {
  taxRates: TaxRateDropdownItem[];
  loading: boolean;
  error: string | null;
}

const initialState: TaxRateState = {
  taxRates: [],
  loading: false,
  error: null,
};

const taxRateSlice = createSlice({
  name: 'taxRateDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxRateDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxRateDropdownThunk.fulfilled, (state, action: PayloadAction<TaxRateDropdownItem[]>) => {
        state.taxRates = action.payload;
        state.loading = false;
      })
      .addCase(fetchTaxRateDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default taxRateSlice.reducer;
