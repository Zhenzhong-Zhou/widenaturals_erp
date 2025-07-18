import groupBy from 'lodash/groupBy';
import type { InventoryActivityLogEntry } from '@features/report/state';

export type MergedInventoryActivityLogEntry = InventoryActivityLogEntry & {
  combinedNames: string;
};

const getMergeKey = (log: InventoryActivityLogEntry, strict = false): string =>
  [
    log.productInfo?.sku,
    log.productInfo?.lotNumber,
    log.actionTimestamp,
    log.actionType,
    ...(strict ? [log.metadata?.source, log.metadata?.source_level] : []),
  ]
    .filter(Boolean)
    .join('-');

export const mergeInventoryActivityLogs = (
  logs: InventoryActivityLogEntry[]
): MergedInventoryActivityLogEntry[] => {
  const grouped = groupBy(logs, getMergeKey);

  return Object.values(grouped)
    .filter((entries): entries is InventoryActivityLogEntry[] =>
      Array.isArray(entries)
    )
    .map((entries) => {
      const base = entries[0]!; // definite assignment

      const locationNames = entries.map((e) => e.locationName).filter(Boolean);
      const warehouseNames = entries
        .map((e) => e.warehouseName)
        .filter(Boolean);
      const combinedNames = Array.from(
        new Set([...locationNames, ...warehouseNames])
      ).join(', ');
      const comments = entries
        .map((e) => e.comments)
        .filter(Boolean)
        .join(' | ');

      return {
        ...base,
        combinedNames,
        comments,
      } as MergedInventoryActivityLogEntry;
    });
};
