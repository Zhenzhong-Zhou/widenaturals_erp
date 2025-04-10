import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DiscountDropdownItem, fetchDiscountDropdownThunk } from '@features/discount';

// Initial state
interface DiscountDropdownState {
  discounts: DiscountDropdownItem[];
  loading: boolean;
  error: string | null;
}

const initialState: DiscountDropdownState = {
  discounts: [],
  loading: false,
  error: null,
};

const discountDropdownSlice = createSlice({
  name: 'discountDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscountDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscountDropdownThunk.fulfilled, (state, action: PayloadAction<DiscountDropdownItem[]>) => {
        state.discounts = action.payload;
        state.loading = false;
      })
      .addCase(fetchDiscountDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default discountDropdownSlice.reducer;
