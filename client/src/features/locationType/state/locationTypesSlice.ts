import { createSlice } from '@reduxjs/toolkit';
import { fetchLocationTypes } from './locationTypesThunks.ts';
import { LocationType, Pagination } from './locationTypeTypes.ts';

/**
 * Defines the Redux state for location types.
 */
interface LocationTypesState {
  data: LocationType[]; // Stores the list of location types
  pagination: Pagination; // Stores pagination metadata
  loading: boolean;
  error: string | null;
}

const initialState: LocationTypesState = {
  data: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const locationTypesSlice = createSlice({
  name: 'locationTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data.data;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchLocationTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch location types';
      });
  },
});

export default locationTypesSlice.reducer;
