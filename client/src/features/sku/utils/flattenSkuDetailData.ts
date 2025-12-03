import type {
  FlattenedComplianceRecord,
  FlattenedImageMetadata,
  FlattenedPricingRecord,
  FlattenedSkuInfo,
  SkuComplianceRecord,
  SkuDetail,
  SkuImage,
} from '@features/sku/state';

/* ========================================================================== */
/* IMAGE METADATA FLATTENER                                                   */
/* ========================================================================== */

/**
 * Flatten a SKU image into a normalized flat structure for UI table or popover display.
 *
 * Responsibilities:
 * - Converts boolean → "Yes" / "No"
 * - Extracts metadata + audit fields safely
 * - Returns `null` if no image is provided
 *
 * Used by `<ImageMetadataPopover />`.
 *
 * @param img - Raw SkuImage object (or null)
 * @returns FlattenedImageMetadata | null
 */
export const flattenImageMetadata = (
  img: SkuImage | null,
): FlattenedImageMetadata | null => {
  if (!img) return null;
  
  return {
    type: img.type ?? null,
    isPrimary: img.isPrimary ? "Yes" : "No",
    displayOrder: img.metadata?.displayOrder ?? null,
    sizeKb: img.metadata?.sizeKb ?? null,
    format: img.metadata?.format ?? null,
    uploadedBy: img.audit?.uploadedBy?.name ?? null,
    uploadedAt: img.audit?.uploadedAt ?? null,
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
    lengthCm: dimensions?.cm?.length ?? "",
    widthCm: dimensions?.cm?.width ?? "",
    heightCm: dimensions?.cm?.height ?? "",
    lengthInch: dimensions?.inches?.length ?? "",
    widthInch: dimensions?.inches?.width ?? "",
    heightInch: dimensions?.inches?.height ?? "",
    weightG: dimensions?.weight?.g ?? "",
    weightLb: dimensions?.weight?.lb ?? "",
    
    // Status
    statusName: status?.name ?? "unknown",
    statusDate: status?.date ?? "",
    
    // Audit
    createdAt: audit?.createdAt ?? "",
    createdBy: audit?.createdBy?.name ?? "—",
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
    description: rec.metadata?.description ?? "—",
    status: rec.metadata?.status?.name ?? "—",
    statusDate: rec.metadata?.status?.date ?? null,
    
    // Audit
    createdAt: rec.audit?.createdAt ?? "",
    createdBy: rec.audit?.createdBy?.name ?? "—",
    updatedAt: rec.audit?.updatedAt ?? null,
    updatedBy: rec.audit?.updatedBy?.name ?? "—",
  }));
};

/* ========================================================================== */
/* PRICING RECORDS FLATTENER                                                  */
/* ========================================================================== */

/**
 * Flatten pricing entries for table/panel display.
 *
 * Responsibilities:
 * - Extract location info
 * - Extract price + validity dates
 * - Handle status block
 * - Normalize audit user formatting
 *
 * NOTE: Param typed as `any[]` because certain API layers return
 * slightly different shapes. Can be tightened later.
 *
 * @param records - Array of raw pricing objects
 * @returns FlattenedPricingRecord[]
 */
export const flattenPricingRecords = (
  records: any[]
): FlattenedPricingRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((r) => ({
    id: r.id,
    skuId: r.skuId,
    priceType: r.priceType ?? "—",
    
    // Location
    locationName: r.location?.name ?? "—",
    locationType: r.location?.type ?? "—",
    
    // Pricing
    price: r.price ?? "—",
    
    // Status
    status: r.status?.name ?? "—",
    statusDate: r.status?.date ?? null,
    
    // Validity period
    validFrom: r.validFrom ?? null,
    validTo: r.validTo ?? null,
    
    // Audit
    createdBy: r.audit?.createdBy?.name ?? "—",
    createdAt: r.audit?.createdAt ?? null,
    updatedBy: r.audit?.updatedBy?.name ?? "—",
    updatedAt: r.audit?.updatedAt ?? null,
  }));
};
