import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchProductsDropDownByWarehouseThunk, fetchWarehousesDropdownThunk } from './warehouseInventoryThunks.ts';
import { DropdownState } from './warehouseInventoryTypes.ts';

const initialState: DropdownState = {
  products: [],
  warehouses: [],
  loading: false,
  error: null,
};

const inventoryDropdownSlice = createSlice({
  name: 'inventoryDropdown',
  initialState,
  reducers: {
    /**
     * Resets dropdown state (useful when switching between pages)
     */
    resetDropdownData: (state) => {
      state.products = [];
      state.warehouses = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * Handles fetching warehouses (only runs on mount)
       */
      .addCase(fetchWarehousesDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehousesDropdownThunk.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.warehouses = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchWarehousesDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load warehouses';
      })
      
      /**
       * Handles fetching products (runs when warehouse selection changes)
       */
      .addCase(fetchProductsDropDownByWarehouseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsDropDownByWarehouseThunk.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.products = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchProductsDropDownByWarehouseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load products';
      });
  },
});

export const { resetDropdownData } = inventoryDropdownSlice.actions;
export default inventoryDropdownSlice.reducer;
