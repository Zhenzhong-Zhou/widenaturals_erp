import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BomDetailsResponse,
  BomMaterialSupplyDetailsResponse,
  BomProductionReadinessResponse,
  FetchBomsParams,
  FetchPaginatedBomsResponse,
} from '@features/bom/state/bomTypes';
import { bomService } from '@services/bomService';
import { flattenBomRecords } from '@features/bom/utils/flattenBomData';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Redux async thunk to fetch a paginated and filtered list of BOMs.
 *
 * Responsibilities:
 * - Delegates data fetching to the BOM service layer
 * - Applies canonical BOM list flattening at the thunk boundary
 * - Preserves backend pagination metadata
 * - Normalizes all errors into a structured {@link UiErrorPayload}
 *
 * Error Handling:
 * - Uses `rejectWithValue` with `extractUiErrorPayload`
 * - Ensures reducers receive a consistent UI-safe error payload
 *
 * This thunk guarantees Redux state stores only
 * flattened, UI-ready BOM list records.
 *
 * @param params - Pagination, sorting, and filter parameters.
 */
export const fetchPaginatedBomsThunk = createAsyncThunk<
  FetchPaginatedBomsResponse,
  FetchBomsParams,
  { rejectValue: UiErrorPayload }
>('boms/fetchPaginatedBoms', async (params, { rejectWithValue }) => {
  try {
    const response = await bomService.fetchPaginatedBoms(params);

    return {
      ...response,
      data: flattenBomRecords(response.data),
    };
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Thunk to fetch detailed information for a specific BOM.
 *
 * Behavior:
 * - Delegates to `bomService.fetchBomDetails`
 * - Automatically dispatches pending/fulfilled/rejected actions
 * - Normalizes errors into a structured {@link UiErrorPayload}
 *
 * Error Handling:
 * - Uses `rejectWithValue(extractUiErrorPayload(error))`
 * - Ensures consistent UI error shape across slices
 *
 * @param bomId - The BOM ID to fetch details for.
 * @returns A fulfilled action with {@link BomDetailsResponse}.
 */
export const fetchBomDetailsThunk = createAsyncThunk<
  BomDetailsResponse,
  string,
  { rejectValue: UiErrorPayload }
>('boms/fetchBomDetails', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomDetails(bomId);
  } catch (error: unknown) {
    console.error('Failed to fetch BOM details:', { bomId, error });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Thunk to fetch material supply details for a specific BOM.
 *
 * Responsibilities:
 * - Calls `bomService.fetchBomMaterialSupplyDetails`
 * - Returns full structured response with summary and detailed sections
 * - Normalizes all errors into {@link UiErrorPayload}
 *
 * Error Handling:
 * - Rejects using `rejectWithValue` with a structured UI-safe payload
 *
 * @param bomId - The unique BOM identifier.
 * @returns A fulfilled action with {@link BomMaterialSupplyDetailsResponse}.
 */
export const fetchBomMaterialSupplyDetailsThunk = createAsyncThunk<
  BomMaterialSupplyDetailsResponse,
  string,
  { rejectValue: UiErrorPayload }
>('bom/fetchBomMaterialSupplyDetails', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomMaterialSupplyDetails(bomId);
  } catch (error: unknown) {
    console.error('Failed to fetch BOM Material Supply Details:', {
      bomId,
      error,
    });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Thunk to fetch the BOM Production Readiness Summary for a given BOM.
 *
 * Overview:
 * - Invokes `bomService.fetchBomProductionSummary`
 * - Retrieves production readiness metrics, bottlenecks, and stock health
 * - Powers the BOM Production Summary view and planning dashboards
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - Errors are normalized using `extractUiErrorPayload`
 * - Ensures consistent frontend error handling and logging correlation
 *
 * @param bomId - The BOM identifier.
 * @returns A fulfilled action with {@link BomProductionReadinessResponse}.
 */
export const fetchBomProductionSummaryThunk = createAsyncThunk<
  BomProductionReadinessResponse,
  string,
  { rejectValue: UiErrorPayload }
>('bom/fetchBomProductionSummary', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomProductionSummary(bomId);
  } catch (error: unknown) {
    console.error('Failed to fetch BOM Production Summary', { bomId, error });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});
