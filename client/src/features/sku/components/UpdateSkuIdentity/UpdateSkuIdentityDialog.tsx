import { useCallback, useMemo } from 'react';
import { CustomDialog, CustomTypography } from '@components/index';
import {
  UpdateSkuIdentityForm,
  UpdateSkuIdentitySuccessDialog,
  UpdateSkuIdentityErrorDialog,
} from '@features/sku/components/UpdateSkuIdentity';
import { useSkuIdentity } from '@hooks/index';
import type { UpdateSkuIdentityRequest } from '@features/sku/state/skuTypes';

/**
 * Props for UpdateSkuIdentityDialog.
 */
interface UpdateSkuIdentityDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;

  skuId: string;
  skuCode: string;

  /** Existing SKU identity values used to populate the form */
  initialValues: Partial<UpdateSkuIdentityRequest>;
}

/**
 * Dialog used to update SKU identity information (SKU code + barcode).
 *
 * Responsibilities:
 * - Render update form
 * - Submit update request
 * - Display success dialog
 * - Display error dialog
 */
const UpdateSkuIdentityDialog = ({
  open,
  onClose,
  onSuccess,
  skuId,
  skuCode,
  initialValues,
}: UpdateSkuIdentityDialogProps) => {
  const { data, loading, error, isSuccess, updateIdentity, reset } =
    useSkuIdentity();

  /**
   * Default form values derived from existing SKU data.
   */
  const defaultValues = useMemo(
    () => ({
      sku: initialValues.sku ?? '',
      barcode: initialValues.barcode ?? '',
    }),
    [initialValues]
  );

  /**
   * Submit identity update request.
   */
  const handleSubmit = useCallback(
    async (payload: UpdateSkuIdentityRequest) => {
      await updateIdentity(skuId, payload);
    },
    [skuId, updateIdentity]
  );

  /**
   * Close dialog after successful update.
   */
  const handleSuccessClose = () => {
    onSuccess?.();
    reset();
    onClose();
  };

  /**
   * Close dialog and reset mutation state.
   */
  const handleClose = () => {
    reset();
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (isSuccess && data) {
    return (
      <UpdateSkuIdentitySuccessDialog
        open={open}
        onClose={handleSuccessClose}
        skuCode={skuCode}
        responseData={data}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error && !loading) {
    return (
      <UpdateSkuIdentityErrorDialog
        open={open}
        onClose={handleClose}
        skuCode={skuCode}
        error={error}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Main dialog
  // ---------------------------------------------------------------------------

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Update SKU Identity"
      maxWidth="sm"
    >
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating identity for SKU: <strong>{skuCode}</strong>
      </CustomTypography>

      <UpdateSkuIdentityForm
        loading={loading}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
      />
    </CustomDialog>
  );
};

export default UpdateSkuIdentityDialog;
