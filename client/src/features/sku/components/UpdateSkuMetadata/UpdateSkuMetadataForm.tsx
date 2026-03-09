import { type FC } from 'react';
import { CustomForm } from '@components/index';
import { createMetadataFields } from '@features/sku/components/UpdateSkuMetadata';
import type { UpdateSkuMetadataRequest } from '@features/sku/state/skuTypes';
import { getChangedFields } from '@utils/form/getChangedFields';

interface UpdateSkuMetadataFormProps {
  loading?: boolean;
  onSubmit: (data: UpdateSkuMetadataRequest) => void | Promise<void>;
  defaultValues: UpdateSkuMetadataRequest;
}

/**
 * Form for updating editable SKU metadata.
 *
 * This form allows editing descriptive SKU attributes such as
 * description, size label, market region, and language.
 *
 * When submitted, it compares the current form values against
 * the original values and forwards only the fields that have
 * changed to the parent handler.
 */
const UpdateSkuMetadataForm: FC<UpdateSkuMetadataFormProps> = ({
  loading,
  onSubmit,
  defaultValues,
}) => {
  /**
   * Handle form submission.
   *
   * Extracts only metadata fields that differ from the original
   * values. If no changes are detected, the submission is ignored.
   *
   * @param data - Current metadata form values
   */
  const handleSubmit = (data: UpdateSkuMetadataRequest) => {
    const changed = getChangedFields<UpdateSkuMetadataRequest>(
      defaultValues,
      data
    );

    if (Object.keys(changed).length === 0) return;

    onSubmit(changed);
  };

  return (
    <CustomForm
      fields={createMetadataFields()}
      initialValues={defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel="Update Metadata"
      disabled={loading}
      showSubmitButton={!loading}
      sx={{ maxWidth: 500 }}
    />
  );
};

export default UpdateSkuMetadataForm;
