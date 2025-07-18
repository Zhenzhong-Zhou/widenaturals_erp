import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  OrderTypeListResponse,
  PaginatedOrderTypeListState,
} from '@features/orderType/state/orderTypeTypes';
import { fetchPaginatedOrderTypesThunk } from '@features/orderType/state/orderTypeThunks';

const initialState: PaginatedOrderTypeListState = {
  data: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const orderTypesSlice = createSlice({
  name: 'paginatedOrderTypes',
  initialState,
  reducers: {
    /**
     * Resets the paginated order type state to initial.
     */
    resetOrderTypesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedOrderTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaginatedOrderTypesThunk.fulfilled,
        (state, action: PayloadAction<OrderTypeListResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchPaginatedOrderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { resetOrderTypesState } = orderTypesSlice.actions;
export default orderTypesSlice.reducer;
