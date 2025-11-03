import type {
  BomItemWithSupplyAndReadiness,
  FlattenedBomDetailRow,
  FlattenedBomReadinessPartRow,
  FlattenedBomSupplyRow,
  UnifiedBatchRow,
} from '@features/bom/state';
import { dedupeByBatchKey } from '@utils/dedupeHelpers';

/**
 * Merges flattened BOM item details with their corresponding supply
 * and readiness (inventory) records into a unified structure.
 *
 * Matching logic:
 *  - **Primary key:** `bomItemId` — ensures linkage to the BOM item definition.
 *  - **Secondary key:** `partId` — validates alignment between parts and supply/readiness data.
 *  - **Batch-level deduplication:** Removes duplicate supply or readiness rows by `batchId`,
 *    since each batch should be unique across both datasets.
 *
 * This function also removes redundant metadata already contained in
 * the main BOM detail row (e.g., part name, code, or quantity), producing
 * a leaner object model for downstream use in tables or expanded detail panels.
 *
 * @function mergeBomDetailsWithSupplyAndReadiness
 * @param {FlattenedBomDetailRow[]} bomDetails - Flattened BOM item detail rows.
 * @param {FlattenedBomSupplyRow[]} supplyDetails - Flattened supplier/batch records.
 * @param {FlattenedBomReadinessPartRow[]} readinessParts - Flattened readiness (inventory) records.
 * @returns {BomItemWithSupplyAndReadiness[]} Unified array combining BOM details with
 *          their related supply and readiness data.
 *
 * @example
 * const merged = mergeBomDetailsWithSupplyAndReadiness(
 *   flattenedDetails,
 *   flattenedSupplyDetails,
 *   flattenedReadinessParts
 * );
 *
 * console.log(merged[0]);
 * // → {
 * //     bomItemId: "f123abc4-5678-9def-0123-456789abcdef",
 * //     details: {...},
 * //     supplyDetails: [...],
 * //     readinessDetails: [...]
 * //   }
 */
export const mergeBomDetailsWithSupplyAndReadiness = (
  bomDetails: FlattenedBomDetailRow[] | null,
  supplyDetails: FlattenedBomSupplyRow[] | null,
  readinessParts: FlattenedBomReadinessPartRow[] | null
): BomItemWithSupplyAndReadiness[] => {
  if (!bomDetails?.length) return [];

  return bomDetails.map((detail) => {
    const { bomItemId, partId } = detail;

    // --- Supply side ---
    const relatedSupply = dedupeByBatchKey(
      supplyDetails?.filter(
        (s) => s.bomItemId === bomItemId && s.partId === partId
      ) ?? []
    );

    // --- Readiness side ---
    const relatedReadiness = dedupeByBatchKey(
      readinessParts
        ?.filter(
          (r) =>
            r.partId === partId &&
            relatedSupply.some(
              (s) => s.batchId && s.batchId === r.materialBatchId
            )
        )
        ?.map((r) => ({
          ...r,
          batchId: r.materialBatchId ?? undefined,
        })) ?? []
    );

    return {
      bomItemId,
      details: detail,
      supplyDetails: relatedSupply,
      readinessDetails: relatedReadiness,
    };
  });
};

/**
 * Merges supply and readiness batches into unified display rows.
 * - Aligns by `batchId` (or `materialBatchId`)
 * - If both exist for same batch → merge fields (supplier + inventory data)
 * - Otherwise → keeps single row with `source` flag
 */
export const mergeBatchesForDisplay = (
  supply: FlattenedBomSupplyRow[] = [],
  readiness: FlattenedBomReadinessPartRow[] = []
): UnifiedBatchRow[] => {
  const map = new Map<string, UnifiedBatchRow>();

  // --- Insert supply batches ---
  for (const s of supply) {
    const key = s.batchId;
    if (!key) continue;

    map.set(key, {
      source: 'supplier',
      batchId: key,
      lotNumber: s.lotNumber,
      supplierName: s.supplierName,
      unitCost: s.unitCost ?? null,
      currency: s.batchCurrency ?? s.supplierContractCurrency ?? null,
      packagingMaterialName: s.packagingMaterialName,
      partId: s.partId,
      partName: s.partName,
      sourceSupply: s,
    });
  }

  // --- Merge or add readiness batches ---
  for (const r of readiness) {
    const key = r.materialBatchId;
    if (!key) continue;

    if (map.has(key)) {
      // Merge with existing supplier row
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        source: 'merged',
        availableQuantity: r.availableQuantity ?? existing.availableQuantity,
        reservedQuantity: r.reservedQuantity ?? existing.reservedQuantity,
        warehouseName: r.warehouseName ?? existing.warehouseName,
        inventoryStatus: r.inventoryStatus ?? existing.inventoryStatus,
        isBottleneck: r.isBottleneck,
        isShortage: r.isShortage,
        maxProducibleUnits: r.maxProducibleUnits,
        shortageQty: r.shortageQty,
        sourceReadiness: r,
      });
    } else {
      // Add new standalone readiness row
      map.set(key, {
        source: 'readiness',
        batchId: key,
        lotNumber: r.lotNumber ?? '—',
        supplierName: r.supplierName ?? '—',
        warehouseName: r.warehouseName ?? '—',
        availableQuantity: r.availableQuantity,
        reservedQuantity: r.reservedQuantity ?? 0,
        inboundDate: r.inboundDate,
        inventoryStatus: r.inventoryStatus,
        isBottleneck: r.isBottleneck,
        isShortage: r.isShortage,
        maxProducibleUnits: r.maxProducibleUnits,
        shortageQty: r.shortageQty,
        partId: r.partId,
        partName: r.partName,
        sourceReadiness: r,
      });
    }
  }

  return Array.from(map.values());
};
