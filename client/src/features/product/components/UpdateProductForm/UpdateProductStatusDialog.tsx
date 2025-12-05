import { useCallback, useState } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import CustomTypography from '@components/common/CustomTypography';
import useProductStatusUpdate from '@hooks/useProductStatusUpdate';
import type {
  StatusLookupParams,
  StatusLookupOption,
  LookupPaginationMeta,
} from '@features/lookup/state';
import {
  UpdateProductStatusErrorDialog, UpdateProductStatusForm,
  UpdateProductStatusSuccessDialog,
} from '@features/product/components/UpdateProductForm';

/**
 * Unified lookup controller passed into the dialog.
 * Matches the structure returned by useProductStatusLookup().
 */
export interface ProductStatusLookupController {
  options: StatusLookupOption[];
  loading: boolean;
  error: string | null;
  meta: LookupPaginationMeta | undefined;
  
  fetch: (params?: StatusLookupParams) => void;
  reset: () => void;
}

interface UpdateProductStatusDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  
  productId: string;
  productName: string;
  
  /** Fully controlled dropdown lookup handler (hook object) */
  statusLookup: ProductStatusLookupController;
}

const UpdateProductStatusDialog = ({
                                     open,
                                     onClose,
                                     onSuccess,
                                     productId,
                                     productName,
                                     statusLookup,
                                   }: UpdateProductStatusDialogProps) => {
  const [selectedStatusLabel, setSelectedStatusLabel] = useState<string>("");
  
  const {
    data: updateStatusData,
    loading: updateStatusLoading,
    error: updateStatusError,
    isSuccess: updateStatusSuccess,
    updateStatus,
    reset: resetProductStatus,
  } = useProductStatusUpdate();
  
  const handleClose = () => {
    resetProductStatus();
    onClose();
  };
  
  const handleSubmit = useCallback(
    async (formData: { statusId: string; statusLabel: string }) => {
      setSelectedStatusLabel(formData.statusLabel);
      
      await updateStatus({
        productId,
        statusId: formData.statusId,
      });
      
      onSuccess?.();
    },
    [productId, updateStatus, onSuccess]
  );
  
  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------
  if (updateStatusSuccess) {
    return (
      <UpdateProductStatusSuccessDialog
        open={open}
        onClose={handleClose}
        productName={productName}
        newStatusName={selectedStatusLabel}
        responseData={updateStatusData}
      />
    );
  }
  
  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------
  if (updateStatusError && !updateStatusLoading) {
    return (
      <UpdateProductStatusErrorDialog
        open={open}
        onClose={handleClose}
        productName={productName}
        error={updateStatusError}
      />
    );
  }
  
  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------
  return (
    <CustomDialog open={open} onClose={handleClose} title="Update Product Status" maxWidth="sm">
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating status for product: <strong>{productName}</strong>
      </CustomTypography>
      
      <UpdateProductStatusForm
        productId={productId}
        loading={updateStatusLoading}
        onSubmit={handleSubmit}
        statusLookup={statusLookup}
      />
      
      <CustomTypography variant="caption" sx={{ mt: 1 }} color="text.secondary">
        This update will be recorded in the Product audit history.
      </CustomTypography>
    </CustomDialog>
  );
};

export default UpdateProductStatusDialog;
