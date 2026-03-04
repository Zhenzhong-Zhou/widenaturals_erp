import type { FieldConfig } from '@components/common/CustomForm';

/**
 * Factory: Builds field configuration for updating SKU physical dimensions.
 *
 * Units follow the backend API convention:
 * - length_cm
 * - width_cm
 * - height_cm
 * - weight_g
 */
export const createDimensionsFields = (): FieldConfig[] => [
  {
    id: 'lengthCm',
    label: 'Length (cm)',
    type: 'number',
    grid: { xs: 6 },
  },
  {
    id: 'widthCm',
    label: 'Width (cm)',
    type: 'number',
    grid: { xs: 6 },
  },
  {
    id: 'heightCm',
    label: 'Height (cm)',
    type: 'number',
    grid: { xs: 6 },
  },
  {
    id: 'weightG',
    label: 'Weight (g)',
    type: 'number',
    grid: { xs: 6 },
  },
];
