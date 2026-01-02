import { type FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import { createStatusField } from '@features/sku/components/UpdateSkuStatusForm';
import useStatusFieldController, {
  StatusLookupController,
  StatusPayload,
} from '@features/lookup/hooks/useStatusFieldController';

interface UpdateSkuStatusFormProps {
  loading?: boolean;
  onSubmit: (data: StatusPayload) => void | Promise<void>;

  skuId: string;
  statusLookup: StatusLookupController;
}

const UpdateSkuStatusForm: FC<UpdateSkuStatusFormProps> = ({
  loading,
  onSubmit,
  statusLookup,
}) => {
  // -------------------------------
  // Use shared lookup + field logic
  // -------------------------------
  const { formFields, buildSubmitPayload } = useStatusFieldController({
    lookup: statusLookup,
    createField: createStatusField,
  });

  // -------------------------------
  // Submit handler
  // -------------------------------
  const handleSubmit = (data: Record<string, any>) => {
    onSubmit(buildSubmitPayload(data));
  };

  // -------------------------------------------------------
  // Render form
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

export default UpdateSkuStatusForm;
