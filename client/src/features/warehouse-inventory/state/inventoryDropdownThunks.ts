import { createAsyncThunk } from '@reduxjs/toolkit';
import { dropdownService } from '../../../services';

export const fetchInventoryDropdownData = createAsyncThunk('dropdown/fetchData', async () => {
  const products = await dropdownService.fetchProductsForDropdown();
  const warehouses = await dropdownService.fetchWarehousesForDropdown();
  return { products, warehouses };
});
