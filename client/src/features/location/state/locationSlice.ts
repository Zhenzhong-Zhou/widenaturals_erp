import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Location, Pagination, LocationResponse, fetchAllLocations } from '../index.ts';

/**
 * Defines the Redux state for locations.
 */
interface LocationState {
  locations: Location[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  locations: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllLocations.fulfilled,
        (state, action: PayloadAction<LocationResponse>) => {
          state.loading = false;
          state.locations = action.payload.locations;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchAllLocations.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch locations';
      });
  },
});

export default locationSlice.reducer;
