import { type FC } from 'react';
import { CustomForm } from '@components/index';
import { createDimensionsFields } from '@features/sku/components/UpdateSkuDimensions';
import type { UpdateSkuDimensionsFormValues } from '@features/sku/state/skuTypes';
import { getChangedFields } from '@utils/form/getChangedFields';

interface UpdateSkuDimensionsFormProps {
  loading?: boolean;
  onSubmit: (data: UpdateSkuDimensionsFormValues) => void | Promise<void>;
  defaultValues: UpdateSkuDimensionsFormValues;
}

/**
 * Form for updating SKU physical dimensions.
 *
 * This form allows editing the product's physical measurements such as
 * length, width, height, and weight. When submitted, it compares the
 * current form values with the original values and forwards only the
 * fields that have changed to the parent handler.
 *
 * This helps avoid sending unnecessary updates to the API.
 */
const UpdateSkuDimensionsForm: FC<UpdateSkuDimensionsFormProps> = ({
  loading,
  onSubmit,
  defaultValues,
}) => {
  /**
   * Handle form submission.
   *
   * Extracts only dimension fields that differ from the original values.
   * If no changes are detected, the submission is ignored.
   *
   * @param data - Current dimension form values
   */
  const handleSubmit = (data: UpdateSkuDimensionsFormValues) => {
    const changed = getChangedFields<UpdateSkuDimensionsFormValues>(
      defaultValues,
      data
    );

    if (Object.keys(changed).length === 0) return;

    onSubmit(changed);
  };

  return (
    <CustomForm
      fields={createDimensionsFields()}
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Dimensions"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateSkuDimensionsForm;
