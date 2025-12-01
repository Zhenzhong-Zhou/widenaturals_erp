import { useCallback } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import CustomTypography from '@components/common/CustomTypography';
import useSkuStatus from '@hooks/useSkuStatus';
import type {
  LookupPaginationMeta,
  StatusLookupOption,
  StatusLookupParams,
} from '@features/lookup/state';
import {
  UpdateSkuStatusErrorDialog,
  UpdateSkuStatusForm,
  UpdateSkuStatusSuccessDialog,
} from '@features/sku/components/UpdateSkuStatusForm';

/**
 * Props for UpdateSkuStatusDialog
 *
 * This dialog manages three UI states:
 *   1. Form mode (default)
 *   2. Success mode (after API success)
 *   3. Error mode (after API failure)
 *
 * The parent page should:
 *   - supply current lookup options (statusDropdownOptions)
 *   - supply lookup handlers for search/pagination
 *   - provide SKU id + code for display
 */
interface UpdateSkuStatusDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  
  /** Called when the dialog is dismissed */
  onClose: () => void;
  
  /**
   * Optional callback after successful status update.
   * Useful for refreshing parent pages.
   */
  onSuccess?: () => void;
  
  /** SKU database ID (UUID) to update */
  skuId: string;
  
  /** Human-readable SKU code (for UI display) */
  skuCode: string;
  
  /** Dropdown-ready list of status options */
  statusDropdownOptions?: StatusLookupOption[];
  
  /** Fetch lookup options (pagination, search, etc.) */
  fetchStatusDropdownOptions?: (params?: StatusLookupParams) => void;
  
  /** Reset lookup options (clear state) */
  resetStatusDropdownOptions?: () => void;
  
  /** Status lookup loading flag */
  statusLookupLoading?: boolean;
  
  /** Status lookup error for dropdown */
  statusLookupError?: string | null;
  
  /** Metadata for pagination (hasMore, totalCount, etc.) */
  statusLookupMeta?: LookupPaginationMeta;
}


/**
 * Dialog component for updating a SKU's status.
 *
 * Renders:
 *   - Success dialog when update succeeds
 *   - Error dialog when update fails
 *   - Status selection form otherwise
 */
const UpdateSkuStatusDialog = ({
                                 open,
                                 onClose,
                                 onSuccess,
                                 skuId,
                                 skuCode,
                                 statusDropdownOptions,
                                 fetchStatusDropdownOptions,
                                 resetStatusDropdownOptions,
                                 statusLookupLoading,
                                 statusLookupError,
                                 statusLookupMeta,
                               }: UpdateSkuStatusDialogProps) => {
  
  /**
   * Internal slice-based status update state + actions
   */
  const {
    data: updateStatusData,
    loading: updateStatusLoading,
    error: updateStatusError,
    isSuccess: updateStatusSuccess,
    updateStatus,
    reset: resetSkuStatus,
  } = useSkuStatus();
  
  /**
   * Close dialog + reset slice anytime dialog exits.
   */
  const handleClose = () => {
    resetSkuStatus();
    onClose();
  };
  
  /**
   * Submit handler: only pass minimal payload:
   *   { skuId, statusId }
   */
  const handleSubmit = useCallback(
    async (formData: { statusId: string }) => {
      await updateStatus({
        skuId,
        statusId: formData.statusId,
      });
      
      // Parent can refresh lists, invalidate queries, etc.
      if (onSuccess) onSuccess();
    },
    [skuId, updateStatus, onSuccess]
  );
  
  // ---------------------------------------------------------------------------
  // UI STATE 1: Success Mode
  // ---------------------------------------------------------------------------
  if (updateStatusSuccess) {
    return (
      <UpdateSkuStatusSuccessDialog
        open={open}
        onClose={handleClose}
        skuCode={skuCode}
        newStatusName={updateStatusData?.message}
      />
    );
  }
  
  // ---------------------------------------------------------------------------
  // UI STATE 2: Error Mode
  // ---------------------------------------------------------------------------
  if (updateStatusError && !updateStatusLoading) {
    return (
      <UpdateSkuStatusErrorDialog
        open={open}
        onClose={handleClose}
        skuCode={skuCode}
        error={updateStatusError}
      />
    );
  }
  
  // ---------------------------------------------------------------------------
  // UI STATE 3: Default Form Mode
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
        skuId={skuId}
        loading={updateStatusLoading}
        onSubmit={handleSubmit}
        statusDropdownOptions={statusDropdownOptions}
        fetchStatusDropdownOptions={fetchStatusDropdownOptions}
        resetStatusDropdownOptions={resetStatusDropdownOptions}
        statusLookupLoading={statusLookupLoading}
        statusLookupError={statusLookupError}
        statusLookupMeta={statusLookupMeta}
      />
      
      <CustomTypography variant="caption" sx={{ mt: 1 }} color="text.secondary">
        This change will be logged into the SKU audit history.
      </CustomTypography>
    </CustomDialog>
  );
};

export default UpdateSkuStatusDialog;
