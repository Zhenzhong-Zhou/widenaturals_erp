/**
 * @file batch-registry-label.ts
 * @description Pure transformers for batch-registry lookup items: dropdown
 * option mapping, label composition, and expiry-severity styling helpers.
 *
 * No side effects, no logging, no error throwing — these helpers are safe to
 * call inside render paths and memoized selectors.
 */

import type {
  BatchRegistryLookupItem,
  BatchRegistryPackagingMaterialLookupItem,
  BatchRegistryProductLookupItem,
  ExpiryMeta,
} from '@features/lookup/state';
import { formatDate } from '@utils/dateTimeUtils';
import type { ExpirySeverity } from '@shared-types/batch';

/**
 * Dropdown-friendly option shape produced by {@link mapBatchLookupToOptions}.
 */
export interface BatchLookupOption {
  value: string;
  label: string;
  type: string;
}

/**
 * Maps batch-registry lookup items into dropdown options with deduplication.
 *
 * Each item is rendered as `"Name - LOT (Exp: formatted-date)"`. When
 * `useCompositeValue` is true the value embeds the type as `id::type`,
 * letting consumers parse the type back without a second lookup. When false
 * the value is the bare id, which is sufficient as long as ids are unique
 * across product and packaging-material batches (UUIDs guarantee this).
 *
 * Duplicate values are silently dropped — first occurrence wins.
 *
 * @param batchOptions      Lookup items returned by the batch-registry endpoint.
 * @param useCompositeValue When true, value is `${id}::${type}`; otherwise just id.
 * @returns Deduplicated dropdown options.
 */
export const mapBatchLookupToOptions = (
  batchOptions: BatchRegistryLookupItem[],
  useCompositeValue = false
): BatchLookupOption[] => {
  const seen = new Set<string>();
  
  return batchOptions.reduce<BatchLookupOption[]>((acc, item) => {
    const value = useCompositeValue ? `${item.id}::${item.type}` : item.id;
    if (seen.has(value)) return acc;
    seen.add(value);
    
    let label = 'Unknown Type';
    if (item.type === 'product') {
      const name = item.product?.name ?? 'Unknown Product';
      const lot = item.product?.lotNumber ?? 'N/A';
      const exp = formatDate(item.product?.expiryDate);
      label = `${name} - ${lot} (Exp: ${exp})`;
    } else if (item.type === 'packaging_material') {
      const name = item.packagingMaterial?.snapshotName ?? 'Unknown Material';
      const lot = item.packagingMaterial?.lotNumber ?? 'N/A';
      const exp = formatDate(item.packagingMaterial?.expiryDate);
      label = `${name} - ${lot} (Exp: ${exp})`;
    }
    
    acc.push({ value, label, type: item.type });
    return acc;
  }, []);
};

/**
 * Builds a compact bullet-separated label for a batch-registry lookup item.
 *
 * Composes from the appropriate sub-record based on `type`:
 * - product → `"Product Name • LOT123 • 2026-12-31"`
 * - packaging_material → `"Snapshot Name • LOT456 • 2026-06-30"`
 *
 * Falls back to `id` when sub-records are missing — shouldn't happen since
 * the backend transformer guarantees one branch is populated, but keeps the
 * function total.
 *
 * Unlike {@link mapBatchLookupToOptions}, dates are emitted raw (ISO) rather
 * than formatted; this label is intended for compact inline rendering where
 * formatting happens at the call site.
 */
export const composeBatchLabel = (opt: BatchRegistryLookupItem): string => {
  if (opt.type === 'product' && opt.product) {
    const { name, lotNumber, expiryDate } = opt.product;
    return [name, lotNumber, expiryDate ? formatDate(expiryDate) : null]
      .filter(Boolean)
      .join(' • ');
  }
  if (opt.type === 'packaging_material' && opt.packagingMaterial) {
    const { snapshotName, receivedLabel, lotNumber, expiryDate } =
      opt.packagingMaterial;
    return [
      snapshotName ?? receivedLabel,
      lotNumber,
      expiryDate ? formatDate(expiryDate) : null,
    ]
      .filter(Boolean)
      .join(' • ');
  }
  return opt.id;
};

/**
 * Resolves the short, human-readable title for a batch-registry lookup item —
 * intended for row headers, chips, and other compact contexts where the
 * identifier matters more than the full descriptor.
 *
 * Returns the most user-recognizable name available for the batch's type:
 * - product → `product.name`
 * - packaging_material → `packagingMaterial.snapshotName`, falling back to
 *   `receivedLabel` (older batches recorded before snapshots were captured).
 *
 * Falls back to `id` whenever the expected sub-record or its name field is
 * absent — keeps the function total and prevents `undefined` from leaking
 * into the UI.
 *
 * For the long-form descriptor with lot number and expiry, see
 * {@link composeBatchLabel}.
 */
export const composeBatchTitle = (opt: BatchRegistryLookupItem): string => {
  if (opt.type === 'product' && opt.product) {
    return opt.product.name ?? opt.id;
  }
  if (opt.type === 'packaging_material' && opt.packagingMaterial) {
    return (
      opt.packagingMaterial.snapshotName ??
      opt.packagingMaterial.receivedLabel ??
      opt.id
    );
  }
  return opt.id;
};

/**
 * Extracts expiry metadata from a product or packaging-material sub-record.
 *
 * Returns `{ hasExpiryDate: false }` when the sub-record is absent or has no
 * expiry date; otherwise narrows to the populated metadata shape.
 */
const pickExpiryMeta = (
  sub:
    | BatchRegistryProductLookupItem
    | BatchRegistryPackagingMaterialLookupItem
    | undefined
): ExpiryMeta => {
  if (!sub || !sub.hasExpiryDate) return { hasExpiryDate: false };
  const { daysUntilExpiry, isExpired, isNearExpiry, expirySeverity } = sub;
  return {
    hasExpiryDate: true,
    daysUntilExpiry,
    isExpired,
    isNearExpiry,
    expirySeverity,
  };
};

/**
 * Extracts expiry metadata from a batch-registry lookup item by branching on
 * its `type` discriminator. Used to drive expiry chips, sort priority, and
 * filter presets in batch and inventory views.
 */
export const getBatchExpiryMeta = (opt: BatchRegistryLookupItem): ExpiryMeta => {
  if (opt.type === 'product') return pickExpiryMeta(opt.product);
  if (opt.type === 'packaging_material') return pickExpiryMeta(opt.packagingMaterial);
  return { hasExpiryDate: false };
};

/**
 * Maps batch expiry severity to a raw CSS color string for use with custom
 * styling (icon fills, inline `style` props, etc.). For MUI components, use
 * {@link expirySeverityToChipColor} instead.
 *
 * Note: `'yellow'` is poorly visible on light backgrounds — prefer the chip
 * variant unless rendering on a dark surface.
 */
export const expirySeverityToColor = (severity: ExpirySeverity): string => {
  switch (severity) {
    case 'expired':  return 'red';
    case 'critical': return 'orange';
    case 'warning':  return 'yellow';
    case 'normal':   return 'green';
    default: {
      return severity;
    }
  }
};

/**
 * Maps batch expiry severity to a MUI palette color key for use with
 * StatusChip / Chip / Alert components.
 */
export const expirySeverityToChipColor = (
  severity: ExpirySeverity
): 'default' | 'success' | 'warning' | 'error' => {
  switch (severity) {
    case 'expired':  return 'error';
    case 'critical': return 'error';
    case 'warning':  return 'warning';
    case 'normal':   return 'success';
    default: {
      return severity;
    }
  }
};
