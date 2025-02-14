import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchWarehouses } from './warehouseThunks';
import { Pagination, Warehouse } from './warehouseTypes.ts';

// Warehouse State Type
interface WarehouseState {
  warehouses: Warehouse[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

// Initial State
const initialState: WarehouseState = {
  warehouses: [],
  pagination: null,
  loading: false,
  error: null,
};

// Warehouse Slice
const warehouseSlice = createSlice({
  name: 'warehouses',
  initialState,
  reducers: {}, // No manual reducers needed since thunks handle updates
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouses.fulfilled,
        (
          state,
          action: PayloadAction<{
            warehouses: Warehouse[];
            pagination: Pagination;
          }>
        ) => {
          state.warehouses = action.payload.warehouses;
          state.pagination = action.payload.pagination;
          state.loading = false;
        }
      )
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default warehouseSlice.reducer;
