import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BulkSkuImageUploadResponse
} from '@features/skuImage/state';
import { skuImageService } from '@services/skuImageService';

/**
 * Async thunk for performing **bulk SKU image uploads**.
 *
 * This thunk:
 * - Sends a multipart/form-data POST request using `skuImageService.uploadSkuImages()`.
 * - Provides strict compile-time types for the request (`FormData`) and response
 *   (`BulkSkuImageUploadResponse`).
 * - Converts backend exceptions into a typed `rejectValue`, ensuring reducers
 *   always receive predictable error shapes.
 * - Supports batch operations of **1–50 SKUs**, each with **1–100 images**.
 *
 * **Example Usage**
 * ```ts
 * dispatch(uploadSkuImagesThunk(formData));
 * ```
 *
 * **FormData Structure**
 * The FormData passed to this thunk must contain:
 * - `"skus"`: JSON.stringify of the upload definition
 * - `"files"`: one or more binary file blobs (if file uploads are used)
 *
 * **Success Payload (`BulkSkuImageUploadResponse`) Includes:**
 * - `results`: Per-SKU status (`BulkSkuImageUploadResult[]`)
 * - `stats`: Batch processing summary (`BatchProcessStats`)
 * - `success`: Overall success flag
 *
 * **Error Payload (`rejectValue`) Includes:**
 * - `message`: Human-readable error message
 * - `traceId?`: Optional backend correlation identifier
 */
export const uploadSkuImagesThunk = createAsyncThunk<
  BulkSkuImageUploadResponse, // Success payload
  FormData,                   // Thunk argument
  {
    rejectValue: {
      message: string;
      traceId?: string;
    };
  }
>(
  'skuImage/upload',
  async (formData, { rejectWithValue }) => {
    try {
      return await skuImageService.uploadSkuImages(formData);
    } catch (err: any) {
      return rejectWithValue({
        message: err?.message ?? 'Failed to upload SKU images.',
        traceId: err?.traceId
      });
    }
  }
);
