import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchDeliveryMethodDropdownThunk } from './deliveryMethodThunks';
import type { DeliveryMethodDropdownItem } from './deliveryMethodTypes';

interface DeliveryMethodState {
  methods: DeliveryMethodDropdownItem[];
  loading: boolean;
  error: string | null;
}

const initialState: DeliveryMethodState = {
  methods: [],
  loading: false,
  error: null,
};

const deliveryMethodSlice = createSlice({
  name: 'deliveryMethodDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryMethodDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDeliveryMethodDropdownThunk.fulfilled,
        (state, action: PayloadAction<DeliveryMethodDropdownItem[]>) => {
          state.methods = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchDeliveryMethodDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default deliveryMethodSlice.reducer;
