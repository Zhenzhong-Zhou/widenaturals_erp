import { createAsyncThunk } from '@reduxjs/toolkit';
import { OrderType } from './orderTypes.ts';
import { dropdownService } from '../../../services';

export const fetchOrderTypesDropDownThunk = createAsyncThunk<
  OrderType[], // Expected return type
  void, // No arguments needed
  { rejectValue: string } // Error type
>('orderTypes/fetchDropdown', async (_, { rejectWithValue }) => {
  try {
    return await dropdownService.fetchOrderTypesForDropdown(); // Must return OrderType[]
  } catch (error) {
    console.error('Error fetching order types:', error);
    return rejectWithValue('Failed to fetch order types.');
  }
});
