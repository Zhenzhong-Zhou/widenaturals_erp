import type { FieldConfig } from '@components/common/CustomForm';

/**
 * Factory: Builds field configuration for updating SKU identity fields.
 *
 * Used by:
 * - UpdateSkuIdentityForm
 */
export const createIdentityFields = (): FieldConfig[] => [
  {
    id: 'sku',
    label: 'SKU Code',
    type: 'text',
    grid: { xs: 12 },
  },
  {
    id: 'barcode',
    label: 'Barcode',
    type: 'text',
    grid: { xs: 12 },
  },
];
