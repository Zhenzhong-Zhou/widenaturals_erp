import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  FetchPaginatedBomsResponse,
  FetchBomsParams,
  PaginatedBomStateWithFilters,
} from '@features/bom/state/bomTypes';
import { fetchPaginatedBomsThunk } from '@features/bom/state/bomThunks';

const initialState: PaginatedBomStateWithFilters = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
  filters: {},
};

const paginatedBomSlice = createSlice({
  name: 'paginatedBoms',
  initialState,
  reducers: {
    /**
     * Reset all filters and pagination back to default.
     */
    resetPaginatedBoms: () => initialState,

    /**
     * Manually set pagination (useful for table page changes).
     */
    setBomPagination(
      state,
      action: PayloadAction<
        Partial<NonNullable<PaginatedBomStateWithFilters['pagination']>>
      >
    ) {
      if (state.pagination) {
        state.pagination = { ...state.pagination, ...action.payload };
      }
    },

    /**
     * Apply local filters before dispatching fetch.
     */
    setBomFilters(state, action: PayloadAction<FetchBomsParams['filters']>) {
      state.filters = action.payload || {};
    },
  },

  extraReducers: (builder) => {
    builder
      // --- Pending ---
      .addCase(fetchPaginatedBomsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // --- Fulfilled ---
      .addCase(
        fetchPaginatedBomsThunk.fulfilled,
        (state, action: PayloadAction<FetchPaginatedBomsResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      // --- Rejected ---
      .addCase(fetchPaginatedBomsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          'Failed to fetch BOM list.';
      });
  },
});

export const { resetPaginatedBoms, setBomFilters, setBomPagination } =
  paginatedBomSlice.actions;

export default paginatedBomSlice.reducer;
