import { renderBaseInputField } from '@utils/form/FieldRenderers';
import { getSeriesBrandCategoryHelperText } from '@features/product/utils/productFieldValidators';
import type { CustomRenderParams } from '@components/common/CustomForm';
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
