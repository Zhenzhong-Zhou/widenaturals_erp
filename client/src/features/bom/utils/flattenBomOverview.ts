/**
 * BOM transformer utilities.
 *
 * Contains pure functions that convert nested BOM domain responses
 * into flattened, UI-friendly data structures.
 *
 * These utilities are intentionally kept outside Redux slices
 * and should be invoked by thunks or page-level composition logic.
 */

import type {
  BomHeader,
  BomMaterialSupplyDetail,
  BomMaterialSupplySummary,
  BomPartDetail,
  BomReadinessMetadata,
  BomReadinessPart,
  BomSummary,
  FlattenedBomDetailRow,
  FlattenedBomHeader,
  FlattenedBomMaterialSupplySummary,
  FlattenedBomReadinessMetadata,
  FlattenedBomReadinessPartRow,
  FlattenedBomSummary,
  FlattenedBomSupplyRow,
  MaterialBatch,
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
export const flattenBomDetails = (
  details: BomPartDetail[]
): FlattenedBomDetailRow[] => {
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
export const flattenBomSummary = (
  summary: BomSummary | null
): FlattenedBomSummary => {
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

/**
 * Flattens a nested BOM Material Supply Summary response into a
 * simplified, UI-friendly structure for overview panels and dashboards.
 *
 * Keeps nested `suppliers` and `parts` arrays intact so that
 * mini-tables can still render their detailed breakdowns.
 *
 * @param summary - The nested summary object returned from the API.
 * @returns Flattened summary object with derived metrics and preserved sub-structures.
 */
export const flattenBomMaterialSupplySummary = (
  summary: BomMaterialSupplySummary
): FlattenedBomMaterialSupplySummary => {
  const {
    bomId,
    baseCurrency,
    totals: {
      totalEstimatedCost,
      totalActualCost,
      variance,
      variancePercentage,
    },
    suppliers = [],
    parts = [],
  } = summary;

  const supplierCount = suppliers.length;
  const partCount = parts.length;

  return {
    bomId,
    baseCurrency,
    totalEstimatedCost,
    totalActualCost,
    variance,
    variancePercentage,
    supplierCount,
    partCount,
  };
};

/**
 * Flattens a nested BOM Material Supply Detail into an array of
 * table-friendly supply records, one per supplier batch.
 */
export const flattenBomMaterialSupplyDetail = (
  detail: BomMaterialSupplyDetail
): FlattenedBomSupplyRow[] => {
  const { bomId, bomItemId, part, bomItemMaterial, packagingMaterials } =
    detail;

  if (!packagingMaterials?.length) return [];

  const rows: FlattenedBomSupplyRow[] = [];

  for (const material of packagingMaterials) {
    const {
      supplier,
      status: materialStatus,
      audit: materialAudit,
      dimensions,
      ...mat
    } = material;
    if (!supplier) continue;

    const { contract, batches, audit: supplierAudit } = supplier;
    if (!batches?.length) continue;

    for (const batch of batches) {
      const { status: batchStatus, audit: batchAudit } = batch;

      rows.push({
        // --- BOM & Part Metadata ---
        bomId,
        bomItemId,
        partId: part.id,
        partName: part.name,

        // --- BOM Item Material Info ---
        bomItemMaterialId: bomItemMaterial.id,
        requiredQtyPerProduct: bomItemMaterial.requiredQtyPerProduct,
        bomUnit: bomItemMaterial.unit,
        materialNote: bomItemMaterial.note ?? null,
        bomItemMaterialStatusName: bomItemMaterial.status.name,
        bomItemMaterialStatusDate: bomItemMaterial.status.date,
        bomItemMaterialCreatedAt: bomItemMaterial.audit.createdAt,
        bomItemMaterialCreatedBy: bomItemMaterial.audit.createdBy
          ? bomItemMaterial.audit.createdBy.name
          : null,
        bomItemMaterialUpdatedAt: bomItemMaterial.audit.updatedAt,
        bomItemMaterialUpdatedBy: bomItemMaterial.audit.updatedBy
          ? bomItemMaterial.audit.updatedBy.name
          : null,

        // --- Packaging Material Info ---
        packagingMaterialId: mat.id,
        packagingMaterialName: mat.name,
        packagingMaterialCode: mat.code,
        materialComposition: mat.materialComposition ?? null,
        category: mat.category,
        color: mat.color ?? null,
        size: mat.size ?? null,
        grade: mat.grade ?? null,
        estimatedUnitCost: mat.estimatedUnitCost,
        materialCurrency: mat.currency,
        materialExchangeRate: mat.exchangeRate,
        isVisibleForSalesOrder: mat.isVisibleForSalesOrder,
        packagingMaterialLengthCm: dimensions?.length_cm ?? 0,
        packagingMaterialWidthCm: dimensions?.width_cm ?? 0,
        packagingMaterialHeightCm: dimensions?.height_cm ?? 0,
        packagingMaterialWeightG: dimensions?.weight_g ?? 0,
        packagingMaterialLengthInch: dimensions?.length_inch ?? 0,
        packagingMaterialWidthInch: dimensions?.width_inch ?? 0,
        packagingMaterialHeightInch: dimensions?.height_inch ?? 0,
        packagingMaterialWeightLbs: dimensions?.weight_lb ?? 0,
        packagingMaterialStatusName: materialStatus.name,
        packagingMaterialStatusDate: materialStatus.date,
        packagingMaterialCreatedAt: materialAudit.createdAt,
        packagingMaterialCreatedBy: materialAudit.createdBy
          ? materialAudit.createdBy.name
          : null,
        packagingMaterialUpdatedAt: materialAudit.updatedAt,
        packagingMaterialUpdatedBy: materialAudit.updatedBy
          ? materialAudit.updatedBy.name
          : null,

        // --- Supplier Info ---
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierContractUnitCost: contract.unitCost,
        supplierContractCurrency: contract.currency,
        supplierContractExchangeRate: contract.exchangeRate,
        supplierContractValidFrom: contract.validFrom,
        supplierContractValidTo: contract.validTo,
        supplierLeadTimeDays: contract.leadTimeDays ?? null,
        supplierPreferred: contract.isPreferred,
        supplierNote: contract.note ?? null,
        supplierCreatedAt: supplierAudit.createdAt,
        supplierCreatedBy: supplierAudit.createdBy
          ? supplierAudit.createdBy.name
          : null,
        supplierUpdatedAt: supplierAudit.updatedAt,
        supplierUpdatedBy: supplierAudit.updatedBy
          ? supplierAudit.updatedBy.name
          : null,

        // --- Batch Info ---
        batchId: batch.id,
        lotNumber: batch.lotNumber,
        materialSnapshotName: batch.materialSnapshotName,
        receivedLabelName: batch.receivedLabelName,
        unitCost: batch.unitCost,
        quantity: batch.quantity,
        batchUnit: batch.unit,
        batchCurrency: batch.currency,
        batchExchangeRate: batch.exchangeRate,
        totalCost: batch.totalCost,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        batchStatusName: batchStatus.name,
        batchStatusDate: batchStatus.date,
        batchCreatedAt: batchAudit.createdAt,
        batchCreatedBy: batchAudit.createdBy
          ? batchAudit.createdBy.name
          : null,
        batchUpdatedAt: batchAudit.updatedAt,
        batchUpdatedBy: batchAudit.updatedBy ? batchAudit.updatedBy.name : null,
      });
    }
  }

  return rows;
};

/**
 * Flattens an array of BOM Material Supply Details into a single
 * flattened dataset (one row per supplier batch).
 */
export const flattenAllBomMaterialSupplyDetails = (
  details: BomMaterialSupplyDetail[]
): FlattenedBomSupplyRow[] => {
  if (!Array.isArray(details)) return [];
  return details.flatMap(flattenBomMaterialSupplyDetail);
};

/**
 * Flattens an array of BOM readiness parts into a single-level structure
 * where each row represents one material batch linked to a given part.
 *
 * If a part contains no material batches, a single placeholder row is still
 * returned for that part to preserve display consistency.
 *
 * @param parts - Array of `BomReadinessPart` objects, each containing part-level
 *                readiness data and associated material batch records.
 * @returns Array of `FlattenedBomReadinessPartRow` entries representing
 *          part–batch readiness relationships for table rendering.
 *
 * @example
 * const rows = flattenBomReadinessParts(readinessParts);
 * // → [{ partId, partName, lotNumber, availableQuantity, ... }, ...]
 */
export const flattenBomReadinessParts = (
  parts: BomReadinessPart[] = []
): FlattenedBomReadinessPartRow[] => {
  return parts.flatMap((part) => {
    const {
      partId,
      partName,
      requiredQtyPerUnit,
      totalAvailableQuantity,
      maxProducibleUnits,
      isBottleneck,
      isShortage,
      shortageQty,
      materialBatches,
    } = part;

    // If no batches, still return one row for the part
    if (!materialBatches?.length) {
      return [
        {
          partId,
          partName,
          requiredQtyPerUnit,
          totalAvailableQuantity,
          maxProducibleUnits,
          isBottleneck,
          isShortage,
          shortageQty,
        },
      ];
    }

    // Otherwise, expand each material batch
    return materialBatches.map((batch: MaterialBatch) => ({
      partId,
      partName,
      requiredQtyPerUnit,
      totalAvailableQuantity,
      maxProducibleUnits,
      isBottleneck,
      isShortage,
      shortageQty,
      ...batch,
    }));
  });
};

/**
 * Flattens all BOM readiness parts into a unified list of normalized rows.
 *
 * This utility acts as a wrapper for `flattenBomReadinessParts`, ensuring a
 * single-level array of readiness part records. It simplifies integration
 * with UI tables or downstream transformation layers by removing any nested
 * `materialBatches` structure.
 *
 * @param parts - Array of `BomReadinessPart` objects, each representing a part
 *                and its associated material batch readiness data.
 * @returns Flat array of `FlattenedBomReadinessPartRow` entries combining part
 *          and batch-level readiness fields.
 *
 * @example
 * const flat = flattenAllBomReadinessParts(bomReadiness.parts);
 * // → [{ partId, partName, lotNumber, availableQuantity, ... }, ...]
 */
export const flattenAllBomReadinessParts = (
  parts: BomReadinessPart[] = []
): FlattenedBomReadinessPartRow[] => flattenBomReadinessParts(parts);

/**
 * Flattens a BOM readiness metadata object into a single-level structure
 * suitable for table display, summary cards, or export operations.
 *
 * This function extracts key production readiness metrics (e.g., shortage count,
 * bottleneck parts, stock health summary) from the nested `BomReadinessMetadata`
 * object and normalizes them into flat, human-readable fields.
 *
 * @param metadata - The metadata section from a BOM readiness response.
 * @returns A `FlattenedBomReadinessMetadata` object containing normalized
 *          readiness fields for UI display or export.
 *
 * @example
 * const flatMeta = flattenBomReadinessMetadata(response.metadata);
 * // → { readinessStatus: true, readinessMaxUnits: 18, readinessBottleneckPartNames: "Capsule" }
 */
export const flattenBomReadinessMetadata = (
  metadata: BomReadinessMetadata | null
): FlattenedBomReadinessMetadata => {
  if (!metadata) {
    return {
      readinessGeneratedAt: null,
      readinessStatus: null,
      readinessMaxUnits: null,
      readinessShortageCount: null,
      readinessStockHealthSummary: null,
      readinessBottleneckPartNames: null,
      readinessBottleneckMaterialName: null,
      readinessBottleneckMaterialSnapshotName: null,
    };
  }

  const {
    generatedAt,
    isReadyForProduction,
    maxProducibleUnits,
    shortageCount,
    stockHealth,
    bottleneckParts,
  } = metadata;

  // Format stock health summary (example: "usable: 9850, inactive: 0")
  const stockHealthSummary = stockHealth
    ? Object.entries(stockHealth)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ')
    : null;

  // Extract bottleneck parts info
  const partNames = bottleneckParts?.length
    ? bottleneckParts.map((p) => p.partName).join(', ')
    : null;

  const packagingMaterialName = bottleneckParts?.length
    ? bottleneckParts.map((p) => p.packagingMaterialName).join(', ')
    : null;

  const materialSnapshotName = bottleneckParts?.length
    ? bottleneckParts.map((p) => p.materialSnapshotName).join(', ')
    : null;

  return {
    readinessGeneratedAt: generatedAt ?? null,
    readinessStatus: isReadyForProduction ?? null,
    readinessMaxUnits: maxProducibleUnits ?? null,
    readinessShortageCount: shortageCount ?? null,
    readinessStockHealthSummary: stockHealthSummary,
    readinessBottleneckPartNames: partNames,
    readinessBottleneckMaterialName: packagingMaterialName,
    readinessBottleneckMaterialSnapshotName: materialSnapshotName,
    readinessBottleneckCount: bottleneckParts?.length ?? 0,
  };
};
