import { type FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import { createProductStatusField } from '@features/product/components/UpdateProductForm';
import { useStatusFieldController } from '@features/lookup/hooks';
import type {
  StatusLookupController,
  StatusPayload,
} from '@features/lookup/hooks/useStatusFieldController';

interface UpdateProductStatusFormProps {
  /** Whether the form is submitting */
  loading?: boolean;

  /** Handler invoked on form submit */
  onSubmit: (data: StatusPayload) => void | Promise<void>;

  /** Product being updated (optional display) */
  productId: string;

  statusLookup: StatusLookupController;
}

const UpdateProductStatusForm: FC<UpdateProductStatusFormProps> = ({
  loading,
  onSubmit,
  statusLookup,
}) => {
  // -------------------------------------------------------
  // Shared reusable lookup + form-field controller
  // -------------------------------------------------------
  const { formFields, buildSubmitPayload } = useStatusFieldController({
    lookup: statusLookup,
    createField: createProductStatusField,
  });

  // -------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------
  const handleSubmit = (data: Record<string, any>) => {
    onSubmit(buildSubmitPayload(data)); // returns { statusId, statusLabel }
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <CustomForm
      fields={formFields}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Status"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateProductStatusForm;
