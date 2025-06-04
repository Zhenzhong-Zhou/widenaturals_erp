import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetWarehouseDropdownResponse,
  WarehouseDropdownState,
} from '@features/dropdown/state/dropdownTypes';
import { fetchWarehouseDropdownThunk } from '@features/dropdown/state/dropdownThunks';

const initialState: WarehouseDropdownState = {
  data: [],
  loading: false,
  error: null,
};

const warehouseDropdownSlice = createSlice({
  name: 'warehouseDropdown',
  initialState,
  reducers: {
    resetWarehouseDropdown(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseDropdownThunk.fulfilled,
        (state, action: PayloadAction<GetWarehouseDropdownResponse>) => {
          state.data = action.payload.data;
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(fetchWarehouseDropdownThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { resetWarehouseDropdown } = warehouseDropdownSlice.actions;
export default warehouseDropdownSlice.reducer;
