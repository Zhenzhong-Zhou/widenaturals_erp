import { type FC } from 'react';
import { CustomForm } from '@components/index';
import { createStatusField } from '@features/sku/components/UpdateSkuStatus';
import { useStatusFieldController } from '@features/lookup/hooks';
import type {
  StatusLookupController,
  StatusPayload,
} from '@features/lookup/hooks/useStatusFieldController';

/**
 * Props for UpdateSkuStatusForm.
 */
interface UpdateSkuStatusFormProps {
  /** Loading state for submit action */
  loading?: boolean;
  
  /** Submit handler returning the selected status payload */
  onSubmit: (data: StatusPayload) => void | Promise<void>;
  
  /** Controlled lookup object used by the status dropdown */
  statusLookup: StatusLookupController;
  
  /** Current SKU status id used to preselect the dropdown */
  currentStatusId: string;
  
  /** Current SKU status name (used for option injection when lookup loads async) */
  currentStatusName: string;
}

/**
 * Form component for updating a SKU's status.
 *
 * This form uses a shared lookup controller to render a
 * searchable, paginated status dropdown. The current status
 * is pre-selected via `initialValues`.
 *
 * On submit, the form converts raw form values into a
 * `StatusPayload` using the controller's `buildSubmitPayload`
 * helper before forwarding the result to the parent dialog.
 */
const UpdateSkuStatusForm: FC<UpdateSkuStatusFormProps> = ({
                                                             loading,
                                                             onSubmit,
                                                             statusLookup,
                                                             currentStatusId,
                                                             currentStatusName,
                                                           }) => {
  
  // -------------------------------------------------------
  // Shared lookup + field configuration
  // -------------------------------------------------------
  const { formFields, buildSubmitPayload } = useStatusFieldController({
    lookup: statusLookup,
    createField: createStatusField,
    currentStatusId,
    currentStatusName,
  });
  
  // -------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------
  const handleSubmit = (data: Record<string, unknown>) => {
    const payload = buildSubmitPayload(data);
    onSubmit(payload);
  };
  
  return (
    <CustomForm
      fields={formFields}
      initialValues={{ statusId: currentStatusId }}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Status"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateSkuStatusForm;
