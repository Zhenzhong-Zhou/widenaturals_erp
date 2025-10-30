import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  BomMaterialSupplyDetailsResponse,
  BomMaterialSupplyDetailsState
} from '@features/bom/state/bomTypes';
import { fetchBomMaterialSupplyDetailsThunk } from './bomThunks';

const initialState: BomMaterialSupplyDetailsState = {
  data: null,
  loading: false,
  error: null,
  selectedBomId: null,
};

export const bomMaterialSupplyDetailsSlice = createSlice({
  name: 'bomMaterialSupplyDetails',
  initialState,
  reducers: {
    resetBomMaterialSupplyDetails: () => initialState,
    setSelectedBomId: (state, action) => {
      state.selectedBomId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBomMaterialSupplyDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBomMaterialSupplyDetailsThunk.fulfilled, (state, action: PayloadAction<BomMaterialSupplyDetailsResponse>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBomMaterialSupplyDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch BOM Material Supply Details';
      });
  },
});

export const {
  resetBomMaterialSupplyDetails,
  setSelectedBomId,
} = bomMaterialSupplyDetailsSlice.actions;

export default bomMaterialSupplyDetailsSlice.reducer;
