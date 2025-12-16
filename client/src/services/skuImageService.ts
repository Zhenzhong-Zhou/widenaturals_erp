import {
  BulkSkuImageUploadResponse
} from '@features/skuImage/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postFormDataRequest } from '@utils/apiRequest';

/**
 * Uploads one or more SKU images in bulk using multipart/form-data.
 *
 * This service method:
 * - Sends a FormData payload containing JSON (SKU + image metadata)
 *   and optional binary image files.
 * - Supports both file-based uploads and URL-referenced images.
 * - Handles 1–50 SKUs per batch; each SKU may include multiple image items.
 * - Returns backend results including:
 *     • Per-SKU upload outcomes
 *     • Batch processing statistics (success/failure counts, elapsed ms)
 *
 * Error behavior:
 * - Network, validation, or server-side errors are logged.
 * - Errors are rethrown for slice/thunk or UI components to handle.
 *
 * @param {FormData} formData
 *   FormData object containing:
 *     - "skus": a JSON string of upload instructions
 *     - "files": one or more binary image files (optional)
 *
 * @returns {Promise<BulkSkuImageUploadResponse>}
 *   The fully typed response containing:
 *     - results: BulkSkuImageUploadResult[]
 *     - stats: BatchProcessStats
 *
 * @example
 * const formData = new FormData();
 * formData.append("skus", JSON.stringify([
 *   {
 *     skuId: "uuid",
 *     skuCode: "WN-MO411-L-UN",
 *     images: [
 *       {
 *         file_uploaded: true,
 *         image_type: "main",
 *         display_order: 1
 *       }
 *     ]
 *   }
 * ]));
 * formData.append("files", fileInput.files[0]);
 *
 * const response = await uploadSkuImages(formData);
 * console.log(response.stats.successCount);
 */
const uploadSkuImages = async (
  formData: FormData
): Promise<BulkSkuImageUploadResponse> => {
  const url = API_ENDPOINTS.SKU_IMAGES.UPLOAD_IMAGES;
  
  try {
    return await postFormDataRequest<BulkSkuImageUploadResponse>(
      url,
      formData
    );
  } catch (error) {
    console.error("Failed to upload SKU images:", error);
    throw error; // propagate for thunk/UI to handle
  }
};

export const skuImageService = {
  uploadSkuImages,
};
