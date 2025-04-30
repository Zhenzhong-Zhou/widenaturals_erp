import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type DropdownState,
  fetchProductsDropDownByWarehouseThunk,
  fetchWarehousesDropdownThunk,
} from '@features/warehouseInventory';

const initialState: DropdownState = {
  products: [],
  warehouses: [],
  loading: {
    products: false,
    warehouses: false,
  },
  error: {
    products: null,
    warehouses: null,
  },
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
      state.loading.products = false;
      state.loading.warehouses = false;
      state.error.products = null;
      state.error.warehouses = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * Handles fetching warehouses (only runs on mount)
       */
      .addCase(fetchWarehousesDropdownThunk.pending, (state) => {
        state.loading.warehouses = true;
        state.error.warehouses = null;
      })
      .addCase(fetchWarehousesDropdownThunk.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.warehouses = action.payload || [];
        state.loading.warehouses = false;
      })
      .addCase(fetchWarehousesDropdownThunk.rejected, (state, action) => {
        state.loading.warehouses = false;
        state.error.warehouses = action.error.message || 'Failed to load warehouses';
      })

      /**
       * Handles fetching products (runs when warehouse selection changes)
       */
      .addCase(fetchProductsDropDownByWarehouseThunk.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProductsDropDownByWarehouseThunk.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.products = action.payload || [];
        state.loading.products = false;
      })
      .addCase(fetchProductsDropDownByWarehouseThunk.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.error.message || 'Failed to load products';
      });
  },
});

export const { resetDropdownData } = inventoryDropdownSlice.actions;
export default inventoryDropdownSlice.reducer;
