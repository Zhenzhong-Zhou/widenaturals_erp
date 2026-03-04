import { useMemo } from 'react';
import { CustomDialog, CustomTypography } from '@components/index';
import {
  UpdateSkuDimensionsForm,
  UpdateSkuDimensionsSuccessDialog,
  UpdateSkuDimensionsErrorDialog,
} from '@features/sku/components/UpdateSkuDimensions';
import { useSkuDimensions } from '@hooks/index';
import {
  UpdateSkuDimensionsFormValues,
} from '@features/sku/state/skuTypes';
import { transformDimensionsFormToRequest } from '@features/sku/utils/skuTransformers';

interface UpdateSkuDimensionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  
  skuId: string;
  skuCode: string;
  
  initialValues: Partial<UpdateSkuDimensionsFormValues>;
}

/**
 * Dialog for updating SKU physical dimensions.
 *
 * Handles:
 * - API submission
 * - success dialog
 * - error dialog
 */
const UpdateSkuDimensionsDialog = ({
                                     open,
                                     onClose,
                                     onSuccess,
                                     skuId,
                                     skuCode,
                                     initialValues,
                                   }: UpdateSkuDimensionsDialogProps) => {
  
  const {
    data,
    loading,
    error,
    isSuccess,
    updateDimensions,
    reset,
  } = useSkuDimensions();
  
  /**
   * Build form default values from incoming dimension data.
   * Converts numeric values to strings for form inputs.
   */
  const defaultValues = useMemo(() => ({
    lengthCm: Number(initialValues.lengthCm ?? 0),
    widthCm: Number(initialValues.widthCm ?? 0),
    heightCm: Number(initialValues.heightCm ?? 0),
    weightG: Number(initialValues.weightG ?? 0),
  }), [initialValues]);
  
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
   * Close dialog and reset mutation state.
   */
  const handleClose = () => {
    reset();
    onClose();
  };
  
  /**
   * Submit dimensions update request.
   */
  const handleSubmit = async (payload: UpdateSkuDimensionsFormValues) => {
    const requestBody = transformDimensionsFormToRequest(payload);
    
    await updateDimensions(skuId, requestBody);
  };
  
  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (isSuccess && data) {
    return (
      <UpdateSkuDimensionsSuccessDialog
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
      <UpdateSkuDimensionsErrorDialog
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
      title="Update SKU Dimensions"
      maxWidth="sm"
    >
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating dimensions for SKU: <strong>{skuCode}</strong>
      </CustomTypography>
      
      <UpdateSkuDimensionsForm
        loading={loading}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
      />
    </CustomDialog>
  );
};

export default UpdateSkuDimensionsDialog;
