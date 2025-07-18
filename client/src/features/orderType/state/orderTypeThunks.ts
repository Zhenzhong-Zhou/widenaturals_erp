import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse,
} from '@features/orderType/state/orderTypeTypes';
import { orderTypeService } from '@services/orderTypeService';

/**
 * Thunk to fetch a paginated and filtered list of order types.
 *
 * This thunk dispatches a request to the backend using the provided pagination,
 * sorting, and filter parameters. The result is stored in the Redux state under
 * the `orderTypes` slice.
 *
 * @param params - Object containing pagination, sorting, and filtering criteria.
 * @returns A fulfilled payload with `OrderTypeListResponse` or a rejected string message.
 */
export const fetchPaginatedOrderTypesThunk = createAsyncThunk<
  OrderTypeListResponse,
  FetchPaginatedOrderTypesParams,
  { rejectValue: string }
>('orderTypes/fetchPaginated', async (params, { rejectWithValue }) => {
  try {
    return await orderTypeService.fetchPaginatedOrderTypes(params);
  } catch (error: any) {
    console.error('Error fetching order types:', error);
    return rejectWithValue(
      error?.response?.data?.message ||
        'An error occurred while fetching order types.'
    );
  }
});
