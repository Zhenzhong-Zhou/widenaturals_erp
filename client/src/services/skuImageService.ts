import {
  BulkSkuImageUploadRequest,
  BulkSkuImageUploadResponse
} from '@features/skuImage/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

/**
 * Upload SKU images in bulk via the backend API.
 *
 * - Supports uploading images for one or more SKUs.
 * - Each SKU may include 1–100 image definitions.
 * - Accepts a mixed payload of file uploads and URL-based images.
 * - Returns per-SKU results along with batch processing statistics.
 * - Errors are logged and rethrown for upstream handling.
 *
 * @param {BulkSkuImageUploadRequest} payload - Contains SKUs and their images.
 * @returns {Promise<BulkSkuImageUploadResponse>} Response with results and batch stats.
 * @throws Rethrows network or server errors for the caller to handle.
 *
 * @example
 * const res = await uploadSkuImages({
 *   skus: [
 *     {
 *       skuId: 'uuid',
 *       skuCode: 'WN-MO411-L-UN',
 *       images: [
 *         {
 *           file_uploaded: true,
 *           image_type: 'main',
 *           display_order: 1
 *         }
 *       ]
 *     }
 *   ]
 * });
 *
 * console.log(res.stats.succeeded);
 */
const uploadSkuImages = async (
  payload: BulkSkuImageUploadRequest
): Promise<BulkSkuImageUploadResponse> => {
  const url = API_ENDPOINTS.SKU_IMAGES.UPLOAD_IMAGES;
  
  try {
    return await postRequest<BulkSkuImageUploadRequest, BulkSkuImageUploadResponse>(
      url,
      payload
    );
  } catch (error) {
    console.error('Failed to upload SKU images:', error);
    throw error;
  }
};

export const skuImageService = {
  uploadSkuImages,
};
