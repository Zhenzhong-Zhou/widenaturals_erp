import { createAsyncThunk } from '@reduxjs/toolkit';
import { DeliveryMethodDropdownItem } from '@features/deliveryMethod';
import { dropdownService } from '@services/dropdownService';

/**
 * Thunk to fetch delivery methods for dropdown.
 */
export const fetchDeliveryMethodDropdownThunk = createAsyncThunk<
  DeliveryMethodDropdownItem[], // Return type
  { includePickup: boolean },    // Argument type
  { rejectValue: string }        // Error handling type
>(
  'deliveryMethod/fetchDeliveryMethods',
  async ({ includePickup }, { rejectWithValue }) => {
    try {
      return await dropdownService.fetchDeliveryMethodsForDropdown(includePickup);
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
      return rejectWithValue('Failed to fetch delivery methods.');
    }
  }
);
