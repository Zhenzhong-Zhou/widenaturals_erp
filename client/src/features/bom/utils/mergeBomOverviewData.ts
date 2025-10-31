import type {
  FlattenedBomDetailRow,
  FlattenedBomSupplyRow
} from '@features/bom/state';
import { dedupeByBatchKey } from '@utils/dedupeHelpers';

interface BomItemWithSupply {
  bomItemId: string;
  details: FlattenedBomDetailRow;
  supplyDetails: FlattenedBomSupplyRow[];
}

/**
 * Links flattened BOM item details with their corresponding supply records.
 *
 * Matching logic:
 *  - Primary key: `bomItemId`
 *  - Secondary key: `partId` (ensures part alignment)
 *  - Dedupes supply rows by `batchId` (since each batch is unique)
 *
 * Also strips redundant metadata that already exists in the main BOM detail row
 * (like part name, code, or qty) for leaner downstream props.
 */
export const mergeBomDetailsWithSupplyDetails = (
  bomDetails: FlattenedBomDetailRow[] | null,
  supplyDetails: FlattenedBomSupplyRow[] | null
): BomItemWithSupply[] => {
  if (!bomDetails?.length) return [];
  
  return bomDetails.map((detail) => {
    // Filter supply records belonging to the current part
    let relatedSupply =
      supplyDetails?.filter(
        (s) =>
          s.bomItemId === detail.bomItemId &&
          s.partId === detail.partId
      ) ?? [];
    
    // Deduplicate batches or supplier links
    relatedSupply = dedupeByBatchKey(relatedSupply);
    
    return {
      bomItemId: detail.bomItemId,
      details: detail,
      supplyDetails: relatedSupply,
    };
  });
};

