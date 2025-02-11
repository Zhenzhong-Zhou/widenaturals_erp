import { createAsyncThunk } from '@reduxjs/toolkit';
import { LotAdjustmentType } from './warehouseInventoryTypes.ts';
import { lotAdjustmentTypeService } from '../../../services';
import { AppError } from '@utils/AppError.tsx';

// API Call to Fetch Adjustment Types
export const fetchAllDropdownLotAdjustmentTypesThunk = createAsyncThunk<LotAdjustmentType[]>(
  'lotAdjustment/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await lotAdjustmentTypeService.fetchAllDropdownLotAdjustmentTypes();
    } catch (error) {
      return rejectWithValue(error instanceof AppError ? error.message : 'Unknown error');
    }
  }
);