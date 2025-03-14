import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  FetchAllOrderTypesParams,
  OrderTypeResponse,
} from './orderTypeTypes.ts';
import { orderTypeService } from '../../../services';

export const fetchAllOrderTypesThunk = createAsyncThunk<
  OrderTypeResponse,
  FetchAllOrderTypesParams,
  { rejectValue: string }
>(
  'orderTypes/fetchAll',
  async ({ page, limit, sortBy, sortOrder }, { rejectWithValue }) => {
    try {
      return await orderTypeService.fetchAllOrderTypes({
        page,
        limit,
        sortBy,
        sortOrder,
      });
    } catch (error: any) {
      console.error('Error fetching order types:', error);
      return rejectWithValue(
        error.response?.data?.message || 'An error occurred.'
      );
    }
  }
);
