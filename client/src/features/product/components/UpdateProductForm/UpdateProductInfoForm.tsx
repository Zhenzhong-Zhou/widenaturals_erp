import { type FC, useMemo } from 'react';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import type { ProductUpdateRequest } from '@features/product/state/productTypes';
import { buildProductInfoFields } from '@features/product/utils/productFieldFactory';

interface UpdateProductInfoFormProps {
  loading?: boolean;
  onSubmit: (data: ProductUpdateRequest) => void | Promise<void>;
  initialValues: Partial<ProductUpdateRequest>;
}

const UpdateProductInfoForm: FC<UpdateProductInfoFormProps> = ({
                                                                 loading,
                                                                 onSubmit,
                                                                 initialValues,
                                                               }) => {
  
  /**
   * Use the shared field factory in update mode.
   * All fields become optional, matching backend schema.
   */
  const productFormFields = useMemo<FieldConfig[]>(
    () => buildProductInfoFields({ isUpdate: true }),
    []
  );
  
  return (
    <CustomForm
      fields={productFormFields}
      initialValues={initialValues}
      onSubmit={(formData) => onSubmit(formData as ProductUpdateRequest)}
      submitButtonLabel="Update Product Info"
      disabled={loading}
      showSubmitButton
      sx={{ maxWidth: { xs: '100%', sm: '800px' } }}
    />
  );
};

export default UpdateProductInfoForm;
