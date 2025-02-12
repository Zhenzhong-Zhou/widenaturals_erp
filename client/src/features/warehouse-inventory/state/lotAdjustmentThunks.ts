import { createAsyncThunk } from '@reduxjs/toolkit';
import { LotAdjustmentSinglePayload, LotAdjustmentType } from './warehouseInventoryTypes.ts';
import { lotAdjustmentTypeService, warehouseInventoryService } from '../../../services';
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

// Adjust a single lot
export const adjustWarehouseInventoryLot = createAsyncThunk<
  LotAdjustmentSinglePayload,
  { warehouseInventoryLotId: string; payload: LotAdjustmentSinglePayload },
  { rejectValue: string }
>(
  'lotAdjustment/adjustSingle',
  async ({ warehouseInventoryLotId, payload }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.adjustSingleWarehouseInventoryLot(warehouseInventoryLotId, payload);
    } catch (error) {
      return rejectWithValue('Failed to adjust warehouse inventory lot.');
    }
  }
);

// Adjust multiple lots in bulk
// export const bulkAdjustWarehouseInventoryLots = createAsyncThunk<
//   void,
//   BulkLotAdjustmentPayload,
//   { rejectValue: string }
// >(
//   'lotAdjustment/adjustBulk',
//   async (payload, { rejectWithValue }) => {
//     try {
//       // await bulkAdjustWarehouseInventoryLots(payload);
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to adjust multiple lots.');
//     }
//   }
// );
