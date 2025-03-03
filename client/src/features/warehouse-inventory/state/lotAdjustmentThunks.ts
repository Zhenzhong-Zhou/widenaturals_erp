import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  BulkLotAdjustmentPayload,
  LotAdjustmentSinglePayload,
  LotAdjustmentType,
} from './warehouseInventoryTypes.ts';
import {
  lotAdjustmentTypeService,
  warehouseInventoryService,
} from '../../../services';
import { AppError } from '@utils/AppError.tsx';

// API Call to Fetch Adjustment Types
export const fetchAllDropdownLotAdjustmentTypesThunk = createAsyncThunk<
  LotAdjustmentType[]
>('lotAdjustment/fetchTypes', async (_, { rejectWithValue }) => {
  try {
    return await lotAdjustmentTypeService.fetchAllDropdownLotAdjustmentTypes();
  } catch (error) {
    return rejectWithValue(
      error instanceof AppError ? error.message : 'Unknown error'
    );
  }
});

// Adjust a single lot
export const adjustWarehouseInventoryLotThunk = createAsyncThunk<
  LotAdjustmentSinglePayload,
  { warehouseInventoryLotId: string; payload: LotAdjustmentSinglePayload },
  { rejectValue: string }
>(
  'lotAdjustment/adjustSingle',
  async ({ warehouseInventoryLotId, payload }, { rejectWithValue }) => {
    try {
      return await warehouseInventoryService.adjustSingleWarehouseInventoryLotQty(
        warehouseInventoryLotId,
        payload
      );
    } catch (error) {
      return rejectWithValue('Failed to adjust warehouse inventory lot.');
    }
  }
);

// Adjust multiple lots in bulk
export const bulkAdjustWarehouseInventoryLotsQtyThunk = createAsyncThunk<
  void,
  BulkLotAdjustmentPayload,
  { rejectValue: string }
>('lotAdjustment/adjustBulk', async (payload, { rejectWithValue }) => {
  try {
    return await warehouseInventoryService.bulkAdjustWarehouseInventoryLotQty(
      payload
    );
  } catch (error) {
    return rejectWithValue('Failed to adjust multiple lots.');
  }
});
