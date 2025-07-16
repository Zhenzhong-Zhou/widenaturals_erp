import type { BatchType } from "@features/inventoryShared/types/InventorySharedType";
import type { OptionType } from '@components/common/Dropdown';

export const getVisibleBatchOptions = (
  batchType: BatchType,
  options: OptionType[]
) => {
  return ['product', 'packaging_material', 'all'].includes(batchType)
    ? options
    : [];
};
