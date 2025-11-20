import { createSlice } from '@reduxjs/toolkit';
import type { SkuProductCard } from './productTypes.ts';
import { fetchSkuProductCardsThunk } from './productThunks';

interface SkuProductCardState {
  data: SkuProductCard[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: SkuProductCardState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const skuProductCardSlice = createSlice({
  name: 'skuProductCards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkuProductCardsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkuProductCardsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSkuProductCardsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default skuProductCardSlice.reducer;
