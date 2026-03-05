import { useCallback, useState } from 'react';
import {
  CustomDialog,
  CustomTypography
} from '@components/index';
import { useSkuStatus } from '@hooks/index';
import {
  UpdateSkuStatusErrorDialog,
  UpdateSkuStatusForm,
  UpdateSkuStatusSuccessDialog,
} from '@features/sku/components/UpdateSkuStatus';
import type {
  StatusLookupController,
  StatusPayload,
} from '@features/lookup/hooks/useStatusFieldController';

/**
 * Props for UpdateSkuStatusDialog.
 */
interface UpdateSkuStatusDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  
  /** SKU database ID */
  skuId: string;
  
  /** SKU code for display */
  skuCode: string;
  
  /** Controlled lookup hook object */
  statusLookup: StatusLookupController;
  
  /** Current SKU status to prefill the dropdown */
  currentStatusId?: string;
  currentStatusName?: string;
}

/**
 * Dialog for updating a SKU status.
 *
 * UI modes:
 *   1. Form (default)
 *   2. Success
 *   3. Error
 */
const UpdateSkuStatusDialog = ({
                                 open,
                                 onClose,
                                 onSuccess,
                                 skuId,
                                 skuCode,
                                 statusLookup,
                                 currentStatusId,
                                 currentStatusName,
                               }: UpdateSkuStatusDialogProps) => {
  
  /** Used only for displaying the new status in the success dialog */
  const [statusLabel, setStatusLabel] = useState<string>('');
  
  const {
    data,
    loading,
    error,
    isSuccess,
    updateStatus,
    reset,
  } = useSkuStatus();
  
  /**
   * Close dialog after successful update.
   * Also clears local mutation state.
   */
  const handleSuccessClose = () => {
    if (onSuccess) onSuccess();
    reset();
    onClose();
  };
  
  /**
   * Close dialog without success callback.
   */
  const handleClose = () => {
    reset();
    onClose();
  };
  
  /**
   * Submit handler.
   * Only minimal payload is sent to API.
   */
  const handleSubmit = useCallback(
    async (payload: StatusPayload) => {
      
      setStatusLabel(payload.statusLabel);
      
      await updateStatus({
        skuId,
        statusId: payload.statusId,
      });
      
    },
    [skuId, updateStatus]
  );
  
  // ---------------------------------------------------------------------------
  // SUCCESS MODE
  // ---------------------------------------------------------------------------
  
  if (isSuccess && data) {
    return (
      <UpdateSkuStatusSuccessDialog
        open={open}
        onClose={handleSuccessClose}
        skuCode={skuCode}
        newStatusName={statusLabel}
        responseData={data}
      />
    );
  }
  
  // ---------------------------------------------------------------------------
  // ERROR MODE
  // ---------------------------------------------------------------------------
  
  if (error && !loading) {
    return (
      <UpdateSkuStatusErrorDialog
        open={open}
        onClose={handleClose}
        skuCode={skuCode}
        error={error}
      />
    );
  }
  
  // ---------------------------------------------------------------------------
  // FORM MODE
  // ---------------------------------------------------------------------------
  
  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Update SKU Status"
      maxWidth="sm"
    >
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating status for SKU: <strong>{skuCode}</strong>
      </CustomTypography>
      
      <UpdateSkuStatusForm
        loading={loading}
        onSubmit={handleSubmit}
        statusLookup={statusLookup}
        currentStatusId={currentStatusId ?? ''}
        currentStatusName={currentStatusName ?? ''}
      />
      
      <CustomTypography
        variant="caption"
        sx={{ mt: 1 }}
        color="text.secondary"
      >
        This change will be recorded in the SKU audit history.
      </CustomTypography>
    </CustomDialog>
  );
};

export default UpdateSkuStatusDialog;
