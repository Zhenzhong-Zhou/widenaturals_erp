import type {
  SkuProductCard,
  SkuProductCardViewItem,
  SkuProductStatus
} from '@features/sku/state';

/**
 * Normalize backend SKU/product status into three consistent fields:
 *
 * Returns:
 *  - `unifiedStatus`: a single status string when product & sku are identical
 *  - `productStatus`: individual product-level status (if distinct)
 *  - `skuStatus`: individual SKU-level status (if distinct)
 *
 * ### Backend Input Cases:
 *
 * 1. `null`
 *    - Means no status available
 *    - → unifiedStatus = "N/A"
 *
 * 2. `"active"` or `"inactive"` (string)
 *    - Backend uses this form when BOTH product & SKU have the same status
 *    - → unifiedStatus = that value, productStatus & skuStatus omitted
 *
 * 3. `{ product: string | null, sku: string | null }`
 *    - A mixed or partially-defined object
 *    - e.g. `{ product: "active", sku: "inactive" }`
 *    - → no unified status, return each field separately
 *
 * @param status - Raw backend status from `SkuProductStatus`
 *
 * @returns An object containing:
 *  - `productStatus`: string | null
 *  - `skuStatus`: string | null
 *  - `unifiedStatus`: string | null
 */
export const extractStatusFields = (status: SkuProductStatus | null) => {
  // Case 1: no status at all
  if (!status) {
    return {
      productStatus: null,
      skuStatus: null,
      unifiedStatus: "N/A",
    };
  }
  
  // Case 2: backend returned a plain string (both statuses identical)
  if (typeof status !== "object") {
    return {
      productStatus: null,
      skuStatus: null,
      unifiedStatus: status as string,
    };
  }
  
  // Case 3: backend returned { product, sku }
  const { product, sku } = status;
  
  return {
    productStatus: product ?? null,
    skuStatus: sku ?? null,
    unifiedStatus: null, // mismatch — no unified combined value
  };
};

/**
 * Maps a raw `SkuProductCard` (backend shape) into a UI-friendly
 * `SkuProductCardViewItem` used by catalog/grid components.
 *
 * This transformer acts as the single source of truth for how SKU product
 * cards are represented in the frontend, ensuring consistent formatting
 * across selectors, components, and any future export / preview logic.
 *
 * Responsibility:
 *   - normalize missing/null fields
 *   - extract & unify product/SKU status fields
 *   - flatten nested objects (price, image, compliance)
 *   - convert backend naming to UI naming
 */
export const mapSkuProductCardToViewItem = (
  card: SkuProductCard
): SkuProductCardViewItem => {
  const { productStatus, skuStatus, unifiedStatus } =
    extractStatusFields(card.status);
  
  return {
    skuId: card.skuId,
    skuCode: card.skuCode,
    displayName: card.displayName,
    
    brand: card.brand,
    series: card.series,
    category: card.category,
    barcode: card.barcode,
    
    complianceType: card.compliance?.type ?? null,
    complianceNumber: card.compliance?.number ?? null,
    
    unifiedStatus,
    productStatus,
    skuStatus,
    
    msrp: card.price?.msrp ?? null,
    
    imageUrl: card.image?.url ?? null,
    imageAlt: card.image?.alt ?? '',
  };
};
