import { type FC, useMemo } from 'react';
import CustomForm, { FieldConfig } from '@components/common/CustomForm';
import type { CreateProductInput } from '@features/product/state/productTypes';
import { buildProductInfoFields } from '@features/product/utils/productFieldFactory';

interface SingleProductFormProps {
  loading?: boolean;
  onSubmit: (data: CreateProductInput) => void | Promise<void>;
}

const SingleProductForm: FC<SingleProductFormProps> = ({
  loading,
  onSubmit,
}) => {
  const productFormFields = useMemo<FieldConfig[]>(
    () => buildProductInfoFields({ isUpdate: false }),
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
