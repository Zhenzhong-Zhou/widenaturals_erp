import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetWarehouseLookupResponse,
  WarehouseLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchWarehouseLookupThunk } from '@features/lookup/state/lookupThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: WarehouseLookupState = {
  data: [],
  loading: false,
  error: null,
};

const warehouseLookupSlice = createSlice({
  name: 'warehouseLookup',
  initialState,
  reducers: {
    resetWarehouseLookup(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseLookupThunk.fulfilled,
        (state, action: PayloadAction<GetWarehouseLookupResponse>) => {
          state.data = action.payload.data;
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(fetchWarehouseLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch warehouses');
      });
  },
});

export const { resetWarehouseLookup } = warehouseLookupSlice.actions;
export default warehouseLookupSlice.reducer;
