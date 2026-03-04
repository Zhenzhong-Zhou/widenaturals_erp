import { useMemo } from 'react';
import {
  CustomDialog,
  CustomTypography
} from '@components/index';
import { useSkuMetadata } from '@hooks/index';
import {
  UpdateSkuMetadataForm,
  UpdateSkuMetadataSuccessDialog,
  UpdateSkuMetadataErrorDialog,
} from '@features/sku/components/UpdateSkuMetadata';
import {
  transformMetadataFormToRequest
} from '@features/sku/utils/skuTransformers';
import type {
  UpdateSkuMetadataFormValues,
} from '@features/sku/state/skuTypes';

interface UpdateSkuMetadataDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  
  skuId: string;
  skuCode: string;
  
  initialValues: Partial<UpdateSkuMetadataFormValues>;
}

/**
 * Dialog for updating editable metadata fields of a SKU.
 *
 * Handles:
 * - Form submission
 * - API interaction
 * - Success and error dialogs
 *
 * The component delegates the actual form fields to
 * `UpdateSkuMetadataForm`.
 */
const UpdateSkuMetadataDialog = ({
                                   open,
                                   onClose,
                                   onSuccess,
                                   skuId,
                                   skuCode,
                                   initialValues,
                                 }: UpdateSkuMetadataDialogProps) => {
  
  const {
    data,
    loading,
    error,
    isSuccess,
    updateMetadata,
    reset,
  } = useSkuMetadata();
  
  /**
   * Build form default values from incoming metadata.
   * Prevents uncontrolled → controlled input warnings.
   */
  const defaultValues = useMemo(() => ({
    description: initialValues.description ?? '',
    sizeLabel: initialValues.sizeLabel ?? '',
    language: initialValues.language ?? '',
    marketRegion: initialValues.marketRegion ?? '',
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
   * Close dialog without success callback.
   */
  const handleClose = () => {
    reset();
    onClose();
  };
  
  /**
   * Submit metadata update request.
   */
  const handleSubmit = async (payload: UpdateSkuMetadataFormValues) => {
    const requestBody = transformMetadataFormToRequest(payload);
    
    await updateMetadata(skuId, requestBody);
  };
  
  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (isSuccess && data) {
    return (
      <UpdateSkuMetadataSuccessDialog
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
      <UpdateSkuMetadataErrorDialog
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
      title="Update SKU Metadata"
      maxWidth="sm"
    >
      <CustomTypography variant="body2" sx={{ mb: 2 }}>
        Updating metadata for SKU: <strong>{skuCode}</strong>
      </CustomTypography>
      
      <UpdateSkuMetadataForm
        loading={loading}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
      />
    </CustomDialog>
  );
};

export default UpdateSkuMetadataDialog;
