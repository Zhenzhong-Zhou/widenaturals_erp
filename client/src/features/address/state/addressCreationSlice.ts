import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AddressCreationState,
  CreateAddressApiResponse,
} from './addressTypes';
import { createAddressesThunk } from '@features/address/state/addressThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: AddressCreationState = {
  data: null,
  loading: false,
  error: null,
};

export const addressCreationSlice = createSlice({
  name: 'addressCreation',
  initialState,
  reducers: {
    resetAddressCreation: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAddressesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAddressesThunk.fulfilled,
        (state, action: PayloadAction<CreateAddressApiResponse>) => {
          state.loading = false;
          state.error = null;

          // Access the data directly
          const { data, success, message } = action.payload;

          // Normalize to array
          state.data = Array.isArray(data) ? data : [data];

          // Optionally store success and message if your API provides these
          state.success = success;
          state.message = message;
        }
      )
      .addCase(createAddressesThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to create addresses.');
      });
  },
});

export const { resetAddressCreation } = addressCreationSlice.actions;
export default addressCreationSlice.reducer;
