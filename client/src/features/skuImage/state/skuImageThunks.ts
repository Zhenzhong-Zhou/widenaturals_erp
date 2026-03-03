/**
 * ================================================================
 * SKU Image Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates SKU image upload and update workflows.
 * - Serves as the boundary between UI and skuImageService.
 *
 * Scope:
 * - Bulk SKU image uploads
 * - Bulk SKU image updates
 *
 * Architecture:
 * - Multipart requests delegated to skuImageService
 * - No transformation performed at thunk level
 * - Redux reducers handle response state updates
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BulkSkuImageUpdateResponse,
  BulkSkuImageUploadResponse
} from '@features/skuImage/state';
import { skuImageService } from '@services/skuImageService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Uploads one or more SKU images.
 *
 * Responsibilities:
 * - Calls skuImageService.uploadSkuImages
 * - Sends multipart FormData containing image files and metadata
 * - Returns bulk upload result from the backend
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param formData - Multipart form payload containing image files and metadata
 */
export const uploadSkuImagesThunk = createAsyncThunk<
  BulkSkuImageUploadResponse,
  FormData,
  { rejectValue: UiErrorPayload }
>(
  'skuImage/upload',
  async (formData, { rejectWithValue }) => {
    try {
      return await skuImageService.uploadSkuImages(formData);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Updates existing SKU images in bulk.
 *
 * Responsibilities:
 * - Calls skuImageService.updateSkuImages
 * - Sends multipart FormData containing updated image files and metadata
 * - Returns batch update results and processing statistics
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param formData - Multipart form payload containing image updates
 */
export const updateSkuImagesThunk = createAsyncThunk<
  BulkSkuImageUpdateResponse,
  FormData,
  {
    rejectValue: UiErrorPayload;
  }
>('skuImage/update', async (formData, { rejectWithValue }) => {
  try {
    return await skuImageService.updateSkuImages(formData);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
