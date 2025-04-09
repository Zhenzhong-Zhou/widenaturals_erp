import { createSlice } from '@reduxjs/toolkit';
import { fetchLocationTypeDetailsThunk } from './locationTypesThunks.ts';
import { LocationTypeDetail, Pagination } from './locationTypeTypes.ts';

/**
 * Defines the Redux state for location type details.
 */
interface LocationTypeState {
  data: LocationTypeDetail | null;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: LocationTypeState = {
  data: null,
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const locationTypeDetailSlice = createSlice({
  name: 'locationType',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationTypeDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationTypeDetailsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.locationTypeDetail;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLocationTypeDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch location type details';
      });
  },
});

export default locationTypeDetailSlice.reducer;
