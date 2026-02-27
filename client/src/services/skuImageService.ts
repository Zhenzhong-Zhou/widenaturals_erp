import type {
  BulkSkuImageUpdateResponse,
  BulkSkuImageUploadResponse,
} from '@features/skuImage/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postFormDataRequest } from '@utils/http';

/**
 * Uploads one or more SKU images in bulk using multipart/form-data.
 *
 * Transport characteristics:
 * - WRITE policy (non-idempotent, authenticated)
 * - Multipart upload (files + JSON metadata)
 * - Timeout / retry governed centrally by WRITE policy
 *
 * @param formData - Multipart payload containing:
 *   - "skus": JSON string describing SKU → image mappings
 *   - "files": binary image files (optional)
 *
 * @returns Bulk SKU image upload result with per-SKU outcomes and batch stats
 *
 * @throws {AppError}
 * Normalized transport / HTTP / server errors
 */
const uploadSkuImages = async (
  formData: FormData
): Promise<BulkSkuImageUploadResponse> => {
  return postFormDataRequest<BulkSkuImageUploadResponse>(
    API_ENDPOINTS.SKU_IMAGES.UPLOAD_IMAGES,
    formData,
    {
      policy: 'WRITE',
      config: { timeout: 120_000 },
    }
  );
};

/**
 * Updates one or more SKU image groups in bulk.
 *
 * Transport characteristics:
 * - WRITE policy (non-idempotent, authenticated)
 * - JSON payload (metadata + update instructions)
 * - Timeout / retry governed centrally by WRITE policy
 *
 *   {
 *     skus: [
 *       {
 *         skuId,
 *         skuCode,
 *         images: [...]
 *       }
 *     ]
 *   }
 *
 * @returns Bulk SKU image update result with per-SKU outcomes and batch stats
 *
 * @throws {AppError}
 * Normalized transport / HTTP / server errors
 * @param formData
 */
const updateSkuImages = async (
  formData: FormData
): Promise<BulkSkuImageUpdateResponse> => {
  return postFormDataRequest<BulkSkuImageUpdateResponse>(
    API_ENDPOINTS.SKU_IMAGES.UPDATE_IMAGES,
    formData,
    {
      policy: 'WRITE',
      config: { timeout: 120_000 },
    }
  );
};

export const skuImageService = {
  uploadSkuImages,
  updateSkuImages,
};
