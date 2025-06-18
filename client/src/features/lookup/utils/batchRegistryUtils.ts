import type { BatchRegistryLookupItem } from '@features/lookup/state';
import { formatDate } from '@utils/dateTimeUtils';

export const mapBatchLookupToOptions = (
  batchOptions: BatchRegistryLookupItem[],
  useCompositeValue: boolean = false // control ID vs. ID::type
): { value: string; label: string; type: string }[] => {
  const seenValues = new Set<string>();
  
  return batchOptions.reduce((acc, item) => {
    const optionValue = useCompositeValue
      ? `${item.id}::${item.type}`
      : `${item.id}`;
    
    if (seenValues.has(optionValue)) {
      console.warn(`Duplicate detected: ${optionValue}`);
      return acc;
    }
    
    seenValues.add(optionValue);
    
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
    
    acc.push({ value: optionValue, label, type: item.type });
    return acc;
  }, [] as { value: string; label: string; type: string }[]);
}
