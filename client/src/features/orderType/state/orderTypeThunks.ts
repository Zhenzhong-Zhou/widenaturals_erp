import { createAsyncThunk } from '@reduxjs/toolkit';
import { OrderTypeResponse } from './orderTypeTypes.ts';
import { orderTypeService } from '../../../services';

export const fetchAllOrderTypesThunk = createAsyncThunk<OrderTypeResponse, void, { rejectValue: string }>(
  "orderTypes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await orderTypeService.fetchAllOrderTypes();
    } catch (error: any) {
      console.error("Error fetching order types:", error);
      return rejectWithValue(error.response?.data?.message || "An error occurred.");
    }
  }
);
