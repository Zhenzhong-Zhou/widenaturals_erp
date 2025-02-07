import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchAllInventories } from './inventoryThunks.ts';
import { InventoryItem, Pagination, InventoryResponse } from './inventoryTypes.ts';

/**
 * Defines the Redux state for inventories.
 */
interface InventoryState {
  inventories: InventoryItem[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventories: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllInventories.fulfilled, (state, action: PayloadAction<InventoryResponse>) => {
        state.loading = false;
        state.inventories = action.payload.processedData; // Ensure this matches the API response key
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllInventories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch inventories';
      });
  },
});

export default inventorySlice.reducer;
