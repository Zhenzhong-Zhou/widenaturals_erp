import type {
  SkuImageUpdateDraft,
  SkuImageUpdateItem,
  SkuImageUpdateRequestItem,
  BulkSkuImageUpdateRequest,
} from '@features/skuImage/state';

/**
 * Maps UI draft image into API update item.
 *
 * Strips client-only fields.
 */
const mapDraftToUpdateItem = (
  draft: SkuImageUpdateDraft
): SkuImageUpdateItem => ({
  group_id: draft.group_id,
  file_uploaded: draft.file_uploaded,
  image_url: draft.image_url ?? null,
  image_type: draft.image_type,
  display_order: draft.display_order,
  alt_text: draft.alt_text ?? null,
  file_format: draft.file_format,
  is_primary: draft.is_primary,
  source: draft.source,
});

/**
 * Builds multipart FormData payload for bulk SKU image update.
 *
 * Responsibilities:
 * - Converts UI drafts to API update items
 * - Serializes JSON payload under "skus"
 * - Appends binary files under "files"
 *
 * Pure transformation — no validation.
 */
export const buildUpdateFormData = (
  items: {
    skuId: string;
    skuCode: string;
    images: SkuImageUpdateDraft[];
  }[]
): FormData => {
  const form = new FormData();
  
  // 1. Convert UI drafts → API request structure
  const requestPayload: BulkSkuImageUpdateRequest = {
    skus: items.map((item): SkuImageUpdateRequestItem => ({
      skuId: item.skuId,
      skuCode: item.skuCode,
      images: item.images.map(mapDraftToUpdateItem),
    })),
  };
  
  form.append('skus', JSON.stringify(requestPayload.skus));
  
  // 2. Append binary files (from drafts)
  items.forEach((item) => {
    item.images.forEach((img) => {
      if (img.file_uploaded && img.file) {
        form.append('files', img.file);
      }
    });
  });
  
  return form;
};
