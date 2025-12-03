import { type FC, useMemo } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import type { CreateProductInput } from '@features/product/state/productTypes';
import { makeSeriesBrandCategoryField } from '@features/product/utils/productFieldFactory';

interface SingleProductFormProps {
  loading?: boolean;
  onSubmit: (data: CreateProductInput) => void | Promise<void>;
}

const SingleProductForm: FC<SingleProductFormProps> = ({
  loading,
  onSubmit,
}) => {
  /**
   * Product field definitions driven by your CreateProductInput interface
   * and matching the backend Joi schema.
   */
  const productFormFields = useMemo<FieldConfig[]>(
    () => [
      {
        id: 'name',
        label: 'Product Name',
        type: 'text',
        required: true,
        grid: { xs: 12, sm: 6 },
      },
      makeSeriesBrandCategoryField('series', {
        required: false,
        grid: { xs: 12, sm: 6 },
      }),
      makeSeriesBrandCategoryField('brand', {
        required: true,
        grid: { xs: 12, sm: 6 },
      }),
      makeSeriesBrandCategoryField('category', {
        required: true,
        grid: { xs: 12, sm: 6 },
      }),
      {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        grid: { xs: 12 },
      },
    ],
    []
  );

  return (
    <CustomForm
      fields={productFormFields}
      onSubmit={(formData) => onSubmit(formData as CreateProductInput)}
      submitButtonLabel="Create Product"
      disabled={loading}
      showSubmitButton
      sx={{ maxWidth: { xs: '100%', sm: '800px' } }}
    />
  );
};

export default SingleProductForm;
