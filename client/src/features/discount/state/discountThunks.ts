import { createAsyncThunk } from '@reduxjs/toolkit';
import type { DiscountDropdownItem } from '@features/discount';

// Thunk for fetching discounts dropdown
export const fetchDiscountDropdownThunk = createAsyncThunk<
  DiscountDropdownItem[],
  void,
  { rejectValue: string }
>('discountDropdown/fetchDiscounts', async (_, { rejectWithValue }) => {
  try {
    return await dropdownService.fetchDiscountsForDropdown();
  } catch (error) {
    return rejectWithValue('Failed to fetch discounts. Please try again.');
  }
});
