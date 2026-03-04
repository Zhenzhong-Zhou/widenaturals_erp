import type { FieldConfig } from '@components/common/CustomForm';

/**
 * Factory: Builds field configuration for updating SKU metadata.
 *
 * Used by:
 * - UpdateSkuMetadataForm
 */
export const createMetadataFields = (): FieldConfig[] => [
  {
    id: 'sizeLabel',
    label: 'Size Label',
    type: 'text',
    grid: { xs: 12 },
  },
  {
    id: 'language',
    label: 'Language',
    type: 'text',
    grid: { xs: 12 },
  },
  {
    id: 'marketRegion',
    label: 'Market Region',
    type: 'text',
    grid: { xs: 12 },
  },
  {
    id: 'description',
    label: 'Description',
    type: 'textarea',
    grid: { xs: 12 },
  },
];
