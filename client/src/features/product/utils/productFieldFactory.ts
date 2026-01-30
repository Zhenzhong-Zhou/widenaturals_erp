import { renderBaseInputField } from '@utils/form/FieldRenderers';
import { getSeriesBrandCategoryHelperText } from '@features/product/utils';
import type {
  CustomRenderParams,
  FieldConfig,
} from '@components/common/CustomForm';
import type { RowAwareComponentProps } from '@components/common/MultiItemForm';

/**
 * Factory helper to generate a unified FieldConfig for
 * `series`, `brand`, and `category` fields.
 *
 * This wraps both:
 *  - CustomForm (single-item form)
 *  - MultiItemForm (bulk entry form)
 *
 * and ensures consistent:
 *  - rendering
 *  - validation helper text
 *  - uppercase transformation
 *  - field metadata (id, label, grouping, grid layout)
 *
 * @param id - One of "series" | "brand" | "category"
 * @param required - Whether the field must be provided
 * @param grid - Optional grid layout for CustomForm
 * @param group - Optional field grouping (for MultiItemForm)
 *
 * @returns A FieldConfig-compatible object including:
 *  - id, label, type
 *  - customRender (single form)
 *  - component (bulk form)
 *
 * @example
 * const productFormFields = [
 *   makeSeriesBrandCategoryField("series", { required: false }),
 *   makeSeriesBrandCategoryField("brand",  { required: true }),
 *   makeSeriesBrandCategoryField("category", { required: true }),
 * ];
 */
export const makeSeriesBrandCategoryField = (
  id: 'series' | 'brand' | 'category',
  {
    required,
    grid,
    group,
  }: {
    required: boolean;
    grid?: any;
    group?: string;
  }
) => {
  const label = id.charAt(0).toUpperCase() + id.slice(1);

  return {
    id,
    label,
    type: 'custom' as const,
    required,
    grid,
    group,

    /** ------------ SINGLE FORM RENDERER (CustomForm) ------------ */
    customRender: (params: CustomRenderParams) =>
      renderBaseInputField({
        label,
        value: params.value ?? '',
        required: params.required ?? required,
        onChange: params.onChange,
        helperTextFn: getSeriesBrandCategoryHelperText,
        fullWidth: true,
      }),

    /** ------------ BULK FORM RENDERER (MultiItemForm) ------------ */
    component: ({ value, onChange }: RowAwareComponentProps) =>
      renderBaseInputField({
        label,
        value,
        required,
        onChange,
        helperTextFn: getSeriesBrandCategoryHelperText,
        fullWidth: true,
      }),
  };
};

/**
 * Builds the field definitions used in Product creation and update forms.
 *
 * This factory generates a `FieldConfig[]` array compatible with:
 *  - CustomForm (single product create/update)
 *  - MultiItemForm (bulk workflows, if needed)
 *
 * Behavior:
 * - When `isUpdate = false` (default), fields match full creation requirements:
 *      name, brand, and category are required.
 * - When `isUpdate = true`, all fields become optional, matching the backend
 *   `productUpdateSchema`, which requires at least one field to be provided.
 *
 * The field set mirrors the backend Joi schema for product creation/update
 * to ensure consistent validation rules and UI behavior.
 *
 * @param options - Optional configuration object.
 * @param options.isUpdate - When true, marks all fields as optional.
 *
 * @returns An array of `FieldConfig` objects describing the Product form fields.
 *
 * @example
 * // Create Product form
 * const fields = buildProductInfoFields({ isUpdate: false });
 *
 * @example
 * // Update Product Info form
 * const fields = buildProductInfoFields({ isUpdate: true });
 */
export const buildProductInfoFields = (options?: {
  isUpdate?: boolean;
}): FieldConfig[] => {
  const isUpdate = options?.isUpdate ?? false;

  return [
    {
      id: 'name',
      label: 'Product Name',
      type: 'text',
      required: !isUpdate,
      grid: { xs: 12, sm: 6 },
    },
    makeSeriesBrandCategoryField('series', {
      required: false,
      grid: { xs: 12, sm: 6 },
    }),
    makeSeriesBrandCategoryField('brand', {
      required: !isUpdate,
      grid: { xs: 12, sm: 6 },
    }),
    makeSeriesBrandCategoryField('category', {
      required: !isUpdate,
      grid: { xs: 12, sm: 6 },
    }),
    {
      id: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      grid: { xs: 12 },
    },
  ];
};
