import type {
  BomHeader,
  BomPartDetail,
  BomSummary,
  FlattenedBomDetailRow,
  FlattenedBomHeader,
  FlattenedBomSummary,
} from '@features/bom/state/bomTypes';

/**
 * Flattens the BOM header into a single-level object.
 *
 * @param header - The BOM header containing product, sku, compliance, and bom info.
 * @returns A flattened object with prefixed keys for readability.
 */
export const flattenBomHeader = (header: BomHeader): FlattenedBomHeader => {
  if (!header) {
    return {
      productId: null,
      productName: null,
      productBrand: null,
      productSeries: null,
      productCategory: null,
      skuId: null,
      skuCode: null,
      skuBarcode: null,
      skuLanguage: null,
      skuCountryCode: null,
      skuMarketRegion: null,
      skuSizeLabel: null,
      skuDescription: null,
      complianceId: null,
      complianceType: null,
      complianceNumber: null,
      complianceIssuedDate: null,
      complianceExpiryDate: null,
      complianceDescription: null,
      complianceStatus: null,
      bomId: null,
      bomCode: null,
      bomName: null,
      bomRevision: null,
      bomIsActive: null,
      bomIsDefault: null,
      bomDescription: null,
      bomStatus: null,
      bomStatusDate: null,
      bomCreatedAt: null,
      bomCreatedBy: null,
      bomUpdatedAt: null,
      bomUpdatedBy: null,
    };
  }
  
  const { product, sku, compliance, bom } = header;
  
  return {
    // --- Product Info ---
    productId: product?.id ?? null,
    productName: product?.name ?? null,
    productBrand: product?.brand ?? null,
    productSeries: product?.series ?? null,
    productCategory: product?.category ?? null,
    
    // --- SKU Info ---
    skuId: sku?.id ?? null,
    skuCode: sku?.code ?? null,
    skuBarcode: sku?.barcode ?? null,
    skuLanguage: sku?.language ?? null,
    skuCountryCode: sku?.countryCode ?? null,
    skuMarketRegion: sku?.marketRegion ?? null,
    skuSizeLabel: sku?.sizeLabel ?? null,
    skuDescription: sku?.description ?? null,
    
    // --- Compliance Info ---
    complianceId: compliance?.id ?? null,
    complianceType: compliance?.type ?? null,
    complianceNumber: compliance?.number ?? null,
    complianceIssuedDate: compliance?.issuedDate ?? null,
    complianceExpiryDate: compliance?.expiryDate ?? null,
    complianceDescription: compliance?.description ?? null,
    complianceStatus: compliance?.status?.name ?? null,
    
    // --- BOM Info ---
    bomId: bom?.id ?? null,
    bomCode: bom?.code ?? null,
    bomName: bom?.name ?? null,
    bomRevision: bom?.revision ?? null,
    bomIsActive: bom?.isActive ?? null,
    bomIsDefault: bom?.isDefault ?? null,
    bomDescription: bom?.description ?? null,
    bomStatus: bom?.status?.name ?? null,
    bomStatusDate: bom?.status?.date ?? null,
    bomCreatedAt: bom?.audit?.createdAt ?? null,
    bomCreatedBy: bom?.audit?.createdBy?.name ?? null,
    bomUpdatedAt: bom?.audit?.updatedAt ?? null,
    bomUpdatedBy: bom?.audit?.updatedBy?.name ?? null,
  };
};

/**
 * Flattens the BOM details array into a plain array of simple objects.
 *
 * @param details - The array of BOM part detail objects.
 * @returns Flattened array suitable for table display or CSV export.
 */
export const flattenBomDetails = (details: BomPartDetail[]): FlattenedBomDetailRow[] => {
  if (!Array.isArray(details)) return [];
  
  return details.map((item) => ({
    // --- BOM Item Info ---
    bomItemId: item.id ?? null,
    partQtyPerProduct: item.partQtyPerProduct ?? null,
    unit: item.unit ?? null,
    specifications: item.specifications ?? null,
    note: item.note ?? null,
    
    // --- Cost Info ---
    estimatedUnitCost: item.estimatedUnitCost ?? null,
    currency: item.currency ?? null,
    exchangeRate: item.exchangeRate ?? 1,
    estimatedCostCAD:
      item.estimatedUnitCost && item.exchangeRate
        ? Number(item.estimatedUnitCost) * Number(item.exchangeRate)
        : null,
    
    // --- Part Info ---
    partId: item.part?.id ?? null,
    partCode: item.part?.code ?? null,
    partName: item.part?.name ?? null,
    partType: item.part?.type ?? null,
    partUnitOfMeasure: item.part?.unitOfMeasure ?? null,
    partDescription: item.part?.description ?? null,
    
    // --- Audit Info ---
    createdAt: item.audit?.createdAt ?? null,
    createdBy: item.audit?.createdBy?.name ?? null,
    updatedAt: item.audit?.updatedAt ?? null,
    updatedBy: item.audit?.updatedBy?.name ?? null,
  }));
};

/**
 * Flattens the BOM summary section into a single-level object.
 *
 * @param summary - The summary section from a BOM details response.
 * @returns Flat object containing normalized summary fields.
 */
export const flattenBomSummary = (summary: BomSummary | null): FlattenedBomSummary => {
  if (!summary) {
    return {
      summaryType: null,
      summaryDescription: null,
      summaryTotalEstimatedCost: null,
      summaryCurrency: null,
      summaryItemCount: null,
    };
  }
  
  return {
    summaryType: summary.type ?? null,
    summaryDescription: summary.description ?? null,
    summaryTotalEstimatedCost: summary.totalEstimatedCost ?? null,
    summaryCurrency: summary.currency ?? null,
    summaryItemCount: summary.itemCount ?? null,
  };
};
