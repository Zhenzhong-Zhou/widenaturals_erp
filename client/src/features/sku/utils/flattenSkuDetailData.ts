import type {
  FlattenedComplianceRecord,
  FlattenedImageMetadata,
  FlattenedPricingRecord,
  FlattenedSkuInfo,
  SkuComplianceRecord,
  SkuDetail,
  SkuImageGroup,
  SkuPricing,
} from '@features/sku/state';

/* ========================================================================== */
/* IMAGE METADATA FLATTENER                                                   */
/* ========================================================================== */

/**
 * Flatten a SKU image group + variant into a normalized flat structure
 * for UI table or popover display.
 *
 * Responsibilities:
 * - Selects a specific variant (main / thumbnail / zoom)
 * - Converts boolean → "Yes" / "No"
 * - Extracts metadata + audit fields safely
 * - Returns null if group or selected variant does not exist
 *
 * Used by <ImageMetadataPopover />.
 *
 * @param group - SkuImageGroup object (or null)
 * @param variantType - Variant to extract ("main" | "thumbnail" | "zoom")
 * @returns FlattenedImageMetadata | null
 */
export const flattenImageMetadata = (
  group: SkuImageGroup | null,
  variantType: 'main' | 'thumbnail' | 'zoom'
): FlattenedImageMetadata | null => {
  if (!group) return null;

  const variant = group.variants?.[variantType];
  if (!variant) return null;

  return {
    type: variantType,
    isPrimary: group.isPrimary ? 'Yes' : 'No',
    displayOrder: variant.metadata?.displayOrder ?? null,
    sizeKb: variant.metadata?.sizeKb ?? null,
    format: variant.metadata?.format ?? null,
    uploadedBy: group.audit?.uploadedBy?.name ?? null,
    uploadedAt: group.audit?.uploadedAt ?? null,
  };
};

/* ========================================================================== */
/* SKU INFO FLATTENER                                                         */
/* ========================================================================== */

/**
 * Flatten top-level SKU fields for list/table export usage.
 *
 * This includes:
 * - SKU identity fields
 * - Dimensions (metric + imperial)
 * - Status block
 * - Audit block (created/updated)
 *
 * Excludes nested arrays: pricing, images, compliance, product links.
 *
 * @param data - Full SkuDetail object from API
 * @returns FlattenedSkuInfo with safe fallbacks
 */
export const flattenSkuInfo = (data: SkuDetail): FlattenedSkuInfo => {
  const {
    id,
    sku,
    barcode,
    description,
    language,
    sizeLabel,
    countryCode,
    marketRegion,
    dimensions,
    status,
    audit,
  } = data;

  return {
    id,
    sku,
    barcode,
    description,
    language,
    sizeLabel,
    countryCode,
    marketRegion,

    // Dimensions (with empty-string fallback for UI table consistency)
    lengthCm: dimensions?.cm?.length ?? null,
    widthCm: dimensions?.cm?.width ?? null,
    heightCm: dimensions?.cm?.height ?? null,
    lengthInch: dimensions?.inches?.length ?? null,
    widthInch: dimensions?.inches?.width ?? null,
    heightInch: dimensions?.inches?.height ?? null,
    weightG: dimensions?.weight?.g ?? null,
    weightLb: dimensions?.weight?.lb ?? null,

    // Status
    statusId: status?.id ?? '',
    statusName: status?.name ?? 'unknown',
    statusDate: status?.date ?? '',

    // Audit
    createdAt: audit?.createdAt ?? '',
    createdBy: audit?.createdBy?.name ?? '—',
    updatedAt: audit?.updatedAt ?? null,
    updatedBy: audit?.updatedBy?.name ?? null,
  };
};

/* ========================================================================== */
/* COMPLIANCE RECORDS FLATTENER                                               */
/* ========================================================================== */

/**
 * Flatten a list of compliance records for data grid / table display.
 *
 * Responsibilities:
 * - Extract compliance metadata
 * - Flatten status block
 * - Flatten audit block
 * - Ensure placeholders for missing values
 *
 * @param records - Original array of SkuComplianceRecord
 * @returns FlattenedComplianceRecord[]
 */
export const flattenComplianceRecords = (
  records: SkuComplianceRecord[]
): FlattenedComplianceRecord[] => {
  if (!Array.isArray(records)) return [];

  return records.map((rec) => ({
    id: rec.id,
    type: rec.type,
    complianceId: rec.complianceId,
    issuedDate: rec.issuedDate ?? null,
    expiryDate: rec.expiryDate ?? null,

    // Metadata
    description: rec.metadata?.description ?? '—',
    status: rec.metadata?.status?.name ?? '—',
    statusDate: rec.metadata?.status?.date ?? null,

    // Audit
    createdAt: rec.audit?.createdAt ?? '',
    createdBy: rec.audit?.createdBy?.name ?? '—',
    updatedAt: rec.audit?.updatedAt ?? null,
    updatedBy: rec.audit?.updatedBy?.name ?? '—',
  }));
};

/* ========================================================================== */
/* PRICING RECORDS FLATTENER                                                  */
/* ========================================================================== */

/**
 * Flatten SKU pricing records into a table-friendly row shape.
 *
 * Explodes the nested `status` and `audit` blocks into flat fields and
 * preserves `null` for missing values so callers decide on the display
 * fallback. Returns `[]` for non-array input.
 *
 * @param records SKU pricing records from the detail response
 * @returns Flattened rows for tables and panels
 */
export const flattenPricingRecords = (
  records: SkuPricing[]
): FlattenedPricingRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((r) => ({
    id: r.pricingId,
    pricingId: r.pricingId,
    skuId: r.skuId,
    pricingGroupId: r.pricingGroupId,
    
    pricingTypeId: r.pricingTypeId ?? null,
    pricingTypeName: r.pricingTypeName ?? null,
    pricingTypeCode: r.pricingTypeCode ?? null,
    
    countryCode: r.countryCode ?? null,
    price: r.price,
    
    statusId: r.status?.id ?? null,
    statusName: r.status?.name ?? null,
    statusDate: r.status?.date ?? null,
    
    validFrom: r.validFrom ?? null,
    validTo: r.validTo ?? null,
    
    createdBy: r.audit?.createdBy?.name ?? null,
    createdAt: r.audit?.createdAt ?? null,
    updatedBy: r.audit?.updatedBy?.name ?? null,
    updatedAt: r.audit?.updatedAt ?? null,
  }));
};
