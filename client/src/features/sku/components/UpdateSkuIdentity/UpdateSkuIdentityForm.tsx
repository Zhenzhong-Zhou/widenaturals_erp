import { type FC } from 'react';
import { CustomForm } from '@components/index';
import type { UpdateSkuIdentityRequest } from '@features/sku/state/skuTypes';
import { createIdentityFields } from '@features/sku/components/UpdateSkuIdentity';
import { getChangedFields } from '@utils/form/getChangedFields';

/**
 * Props for UpdateSkuIdentityForm.
 */
interface UpdateSkuIdentityFormProps {
  loading?: boolean;
  
  /** Called when the form submits updated identity values */
  onSubmit: (data: UpdateSkuIdentityRequest) => void | Promise<void>;
  
  /** Initial identity values used to populate the form */
  defaultValues: Partial<UpdateSkuIdentityRequest>;
}

/**
 * Form for updating SKU identity information.
 *
 * This form allows editing the SKU code and barcode. When submitted,
 * it compares the current form values against the initial values and
 * forwards only the fields that have changed to the parent handler.
 *
 * This prevents sending unnecessary updates to the API.
 */
const UpdateSkuIdentityForm: FC<UpdateSkuIdentityFormProps> = ({
                                                                 loading,
                                                                 onSubmit,
                                                                 defaultValues,
                                                               }) => {
  /**
   * Handle form submission.
   *
   * Extracts only fields that differ from the original values.
   * If no changes are detected, the submission is ignored.
   *
   * @param data - Current form values submitted by the form
   */
  const handleSubmit = (data: UpdateSkuIdentityRequest) => {
    const changed = getChangedFields<UpdateSkuIdentityRequest>(
      defaultValues,
      data
    );
    
    if (Object.keys(changed).length === 0) return;
    
    onSubmit(changed);
  };
  
  return (
    <CustomForm
      fields={createIdentityFields()}
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Identity"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateSkuIdentityForm;
