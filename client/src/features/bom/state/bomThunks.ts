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

/**
 * Redux async thunk to fetch a paginated and filtered list of BOMs.
 *
 * Responsibilities:
 * - Delegates data fetching to the BOM service layer
 * - Applies canonical BOM list flattening at the thunk boundary
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a UI-safe payload
 *
 * This thunk ensures that Redux state only ever stores
 * flattened, UI-ready BOM list records.
 *
 * @param params - Pagination, sorting, and filter parameters.
 *
 * @example
 * dispatch(fetchPaginatedBomsThunk({
 *   page: 1,
 *   limit: 10,
 *   filters: { isActive: true }
 * }));
 */
export const fetchPaginatedBomsThunk = createAsyncThunk<
  FetchPaginatedBomsResponse,
  FetchBomsParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'boms/fetchPaginatedBoms',
  async (params, { rejectWithValue }) => {
    try {
      const response = await bomService.fetchPaginatedBoms(params);
      
      return {
        ...response,
        data: flattenBomRecords(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Thunk to fetch detailed information for a specific BOM.
 *
 * Dispatches pending, fulfilled, and rejected actions automatically.
 *
 * @param bomId - The BOM ID to fetch details for.
 * @returns A Redux async thunk action that resolves with detailed BOM data.
 *
 * @example
 * dispatch(fetchBomDetailsThunk('61bb1f94-aeb2-4724-b9b8-35023b165fdd'));
 */
export const fetchBomDetailsThunk = createAsyncThunk<
  BomDetailsResponse, // The resolved payload type
  string, // The argument type (bomId)
  { rejectValue: string } // Optional reject type for better typing
>('boms/fetchBomDetails', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomDetails(bomId);
  } catch (error: any) {
    console.error('Failed to fetch BOM details:', error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to load BOM details.';
    return rejectWithValue(message);
  }
});

/**
 * Thunk: Fetch material supply details for a specific BOM.
 *
 * Dispatches an async request to load detailed supplier, cost,
 * and batch breakdowns for all BOM items.
 *
 * Notes:
 * - Uses `bomService.fetchBomMaterialSupplyDetails(bomId)` to call the API.
 * - Returns full structured response with summary and detailed sections.
 * - Consumed by BOM Material Supply Details UI and cost analysis modules.
 *
 * @param bomId - The unique BOM identifier to fetch material supply details for.
 * @returns A fulfilled action with {@link BomMaterialSupplyDetailsResponse}.
 *
 * @example
 * dispatch(fetchBomMaterialSupplyDetailsThunk('cbbf2680-2730-4cb1-a38e-ce32f93609c1'));
 */
export const fetchBomMaterialSupplyDetailsThunk = createAsyncThunk<
  BomMaterialSupplyDetailsResponse,
  string
>('bom/fetchBomMaterialSupplyDetails', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomMaterialSupplyDetails(bomId);
  } catch (error: any) {
    console.error('Failed to fetch BOM Material Supply Details:', {
      bomId,
      error,
    });
    return rejectWithValue(error.response?.data ?? error.message);
  }
});

/**
 * Thunk to fetch the **BOM Production Readiness Summary** for a given BOM.
 *
 * **Overview:**
 * - Invokes {@link bomService.fetchBomProductionSummary} to retrieve production readiness data
 *   including overall producibility metrics, bottleneck parts, stock health, and detailed
 *   material batch availability for each part.
 * - Provides the core readiness data used by the BOM Production Summary view and
 *   production planning dashboards.
 * - Automatically manages async loading and error states through the Redux slice.
 *
 * **Dispatch Example:**
 * ```ts
 * dispatch(fetchBomProductionSummaryThunk(bomId));
 * ```
 *
 * **Returned Data Includes:**
 * - `metadata`: Global readiness metrics (e.g., `maxProducibleUnits`, `isReadyForProduction`).
 * - `parts`: Per-part details, including shortages, bottlenecks, and material batches.
 *
 * **Error Handling:**
 * - Rejects with a structured `{ message, status }` payload for consistent error reporting.
 * - Errors are logged with contextual metadata for diagnostics.
 *
 * **Related Files:**
 * - Service: `bomService.fetchBomProductionSummary`
 * - Slice: `bomProductionReadinessSlice.ts`
 * - Types: `BomProductionReadinessResponse`, `BomReadinessMetadata`, `BomReadinessPart`
 */
export const fetchBomProductionSummaryThunk = createAsyncThunk<
  BomProductionReadinessResponse, // Return type (only data payload)
  string, // Argument type (bomId)
  {
    rejectValue: {
      message: string;
      status?: number;
    };
  }
>('bom/fetchBomProductionSummary', async (bomId, { rejectWithValue }) => {
  try {
    return await bomService.fetchBomProductionSummary(bomId);
  } catch (error: any) {
    console.error('❌ Failed to fetch BOM Production Summary:', error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch BOM production summary.';
    const status = error?.response?.status;

    return rejectWithValue({ message, status });
  }
});
