import type { MultiItemFieldConfig } from '@components/common/MultiItemForm';

interface AdjustableQuantities {
  warehouseQuantity: number;
  reservedQuantity: number;
}

/**
 * MultiItemForm fields for the batch adjust mode. Reserved quantity is
 * permission-gated via FORCE_ADJUST_RESERVED — when the caller lacks the
 * permission the field is omitted from the form entirely rather than
 * shown disabled, matching how the request payload handles it.
 */
export const buildBatchFields = (
  canAdjustReserved: boolean
): MultiItemFieldConfig[] => {
  const fields: MultiItemFieldConfig[] = [
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Qty',
      type: 'number',
      required: true,
      group: 'quantities',
      grid: { xs: 12, sm: 6 },
    },
  ];

  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      type: 'number',
      required: false,
      grid: { xs: 12, sm: 6 },
    });
  }

  return fields;
};

/**
 * CustomForm fields for the single-record adjust mode. Helper text on
 * each field surfaces the current value so the user has context for
 * the change they're entering. Reserved quantity is permission-gated
 * the same way as the batch variant.
 */
export const buildSingleFields = (
  record: AdjustableQuantities,
  canAdjustReserved: boolean
) => {
  const fields = [
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Quantity',
      type: 'number' as const,
      required: true,
      min: 0,
      defaultHelperText: `Current: ${record.warehouseQuantity}`,
    },
  ];

  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Quantity',
      type: 'number' as const,
      required: false,
      min: 0,
      defaultHelperText: `Current: ${record.reservedQuantity}`,
    });
  }

  return fields;
};
