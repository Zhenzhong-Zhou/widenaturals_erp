import { createSlice } from '@reduxjs/toolkit';
import { fetchInventoryDropdownData } from './inventoryDropdownThunks.ts';
import { DropdownState } from './inventoryDropdownTypes.ts';

const initialState: DropdownState = {
  products: [],
  warehouses: [],
  loading: false,
};

const dropdownSlice = createSlice({
  name: 'inventoryDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchInventoryDropdownData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchInventoryDropdownData.fulfilled, (state, action) => {
      state.products = action.payload.products;
      state.warehouses = action.payload.warehouses;
      state.loading = false;
    });
    builder.addCase(fetchInventoryDropdownData.rejected, (state) => {
      state.loading = false;
    });
  },
});

export default dropdownSlice.reducer;
