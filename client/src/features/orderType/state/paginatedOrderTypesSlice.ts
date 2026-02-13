import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  FlattenedOrderTypeRecord,
  OrderTypeListResponse,
  PaginatedOrderTypeListState,
} from '@features/orderType/state/orderTypeTypes';
import { fetchPaginatedOrderTypesThunk } from '@features/orderType/state/orderTypeThunks';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: PaginatedOrderTypeListState =
  createInitialPaginatedState<FlattenedOrderTypeRecord>();

const paginatedOrderTypesSlice = createSlice({
  name: 'paginatedOrderTypes',
  initialState,
  reducers: {
    /** Reset paginated order types to initial state */
    resetPaginatedOrderTypes: () => initialState,
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
        state.error =
          action.payload?.message ?? 'Failed to fetch order types';
      });
  },
});

export const { resetPaginatedOrderTypes } =
  paginatedOrderTypesSlice.actions;

export default paginatedOrderTypesSlice.reducer;
