import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BulkSkuImageUploadRequest,
  BulkSkuImageUploadResponse
} from '@features/skuImage/state';
import { skuImageService } from '@services/skuImageService';

/**
 * Async thunk for performing bulk SKU image uploads.
 *
 * This thunk:
 * - Dispatches a POST request through `skuImageService.uploadSkuImages()`.
 * - Handles typed request/response contracts for stricter compile-time safety.
 * - Normalizes backend errors into a typed reject value for slice reducers.
 * - Supports batch uploads of 1–50 SKUs, each with 1–100 images.
 *
 * Usage:
 * ```ts
 * dispatch(uploadSkuImagesThunk({
 *   skus: [
 *     {
 *       skuId: 'uuid',
 *       skuCode: 'WN-MO409-L-UN',
 *       images: [
 *         {
 *           file_uploaded: true,
 *           image_type: 'main',
 *           display_order: 0
 *         }
 *       ]
 *     }
 *   ]
 * }));
 * ```
 *
 * The fulfilled action returns:
 *   - Full API response (`BulkSkuImageUploadResponse`)
 *   - Per-SKU results (`BulkSkuImageUploadResult[]`)
 *   - Batch processing stats (`BatchProcessStats`)
 *
 * The rejected action contains:
 *   - `message`: Error description
 *   - `traceId`: Optional backend trace identifier
 */
export const uploadSkuImagesThunk = createAsyncThunk<
  BulkSkuImageUploadResponse,        // Success payload type
  BulkSkuImageUploadRequest,         // Thunk argument type
  {
    rejectValue: {
      message: string;
      traceId?: string;
    };
  }
>(
  'skuImage/upload',
  async (payload, { rejectWithValue }) => {
    try {
      return await skuImageService.uploadSkuImages(payload);
    } catch (err: any) {
      // Backend commonly returns { message, traceId }
      return rejectWithValue({
        message: err?.message ?? 'Failed to upload SKU images.',
        traceId: err?.traceId
      });
    }
  }
);
