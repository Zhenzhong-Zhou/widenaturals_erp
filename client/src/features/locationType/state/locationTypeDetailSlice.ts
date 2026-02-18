import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetLocationTypeDetailsUiResponse,
  LocationTypeDetailState,
} from '@features/locationType/state/locationTypeTypes';
import { fetchLocationTypeDetailsThunk } from '@features/locationType';

/**
 * Initial state for the Location Type detail slice.
 */
const initialState: LocationTypeDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const locationTypeDetailSlice = createSlice({
  name: 'locationTypeDetail',
  initialState,
  reducers: {
    /**
     * Allows manual reset of the detail state.
     * Useful when navigating away from the detail page.
     */
    resetLocationTypeDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --------------------------------------------------
      // Pending
      // --------------------------------------------------
      .addCase(fetchLocationTypeDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // --------------------------------------------------
      // Fulfilled
      // --------------------------------------------------
      .addCase(
        fetchLocationTypeDetailsThunk.fulfilled,
        (state, action: PayloadAction<GetLocationTypeDetailsUiResponse>) => {
          state.loading = false;
          state.data = action.payload.data; // unwrap API envelope
        }
      )

      // --------------------------------------------------
      // Rejected
      // --------------------------------------------------
      .addCase(fetchLocationTypeDetailsThunk.rejected, (state, action) => {
        state.loading = false;

        if (action.payload) {
          state.error = action.payload.message;
        } else {
          state.error =
            action.error?.message ?? 'Failed to load location type details.';
        }
      });
  },
});

export const { resetLocationTypeDetail } = locationTypeDetailSlice.actions;

export default locationTypeDetailSlice.reducer;
