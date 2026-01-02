import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import {
  SkuImageUploadCard,
  SkuImageUploadErrorDialog,
  SkuImageUploadSuccessDialog,
} from '@features/skuImage/components/UploadImageForm';
import CustomButton from '@components/common/CustomButton';
import NotFoundPage from '@pages/NotFoundPage';
import GoBackButton from '@components/common/GoBackButton';
import usePagePermissionGuard from '@features/authorize/hooks/usePagePermissionGuard';
import useSkuImageUpload from '@hooks/useSkuImageUpload';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { SelectedSku } from '@features/sku/state';
import {
  BulkSkuImageUploadItem,
  SkuImageUploadCardData,
} from '@features/skuImage/state';
import { serializeBulkSkuImageUpload } from '@features/skuImage/utils/imageFormatUtils';

// -----------------------------------------------------------------------------
// Component: SkuImageBulkUploadPage
// -----------------------------------------------------------------------------
const SkuImageBulkUploadPage = () => {
  // ---------------------------------------------------------------------------
  // 1. Router + Permission Guards
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedSkus = state?.selectedSkus ?? [];

  const { isAllowed } = usePagePermissionGuard(['create_skus_images']);

  // ---------------------------------------------------------------------------
  // 2. Local State – upload items
  // ---------------------------------------------------------------------------
  const [items, setItems] = useState(() =>
    selectedSkus.map((sku: SelectedSku) => ({
      skuId: sku.skuId,
      skuCode: sku.skuCode,
      displayProductName: sku.displayProductName ?? '',
      images: [],
    }))
  );

  // ---------------------------------------------------------------------------
  // 3. Dialog Visibility State
  // ---------------------------------------------------------------------------
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // ---------------------------------------------------------------------------
  // 4. Refs (for focus restore)
  // ---------------------------------------------------------------------------
  const uploadImageButtonRef = useRef<HTMLButtonElement | null>(null);

  // ---------------------------------------------------------------------------
  // 5. Upload Hook (data, statuses, results)
  // ---------------------------------------------------------------------------
  const {
    loading: uploadLoading,
    error: uploadError,
    isSuccess,
    stats: uploadStats,
    results: uploadResults,
    hasResults: uploadHasResults,
    succeededCount: uploadSucceededCount,
    failedCount: uploadFailedCount,
    uploadImages: submitSkuImageUpload,
    reset: resetUploadState,
  } = useSkuImageUpload();

  // ---------------------------------------------------------------------------
  // 6. Derived Booleans
  // ---------------------------------------------------------------------------
  const isHardFailure = !uploadLoading && uploadError && !isSuccess;

  // ---------------------------------------------------------------------------
  // 7. Utility: Build FormData
  // ---------------------------------------------------------------------------
  const buildFormData = (items: BulkSkuImageUploadItem[]) => {
    const form = new FormData();
    form.append('skus', JSON.stringify(serializeBulkSkuImageUpload(items)));

    items.forEach((item) => {
      item.images.forEach((img) => {
        if (img.file) form.append('files', img.file);
      });
    });

    return form;
  };

  // ---------------------------------------------------------------------------
  // 8. Handlers
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    try {
      const formData = buildFormData(items);
      await submitSkuImageUpload(formData);
    } catch (err) {
      console.error('Upload error:', err);
      openUploadErrorDialogWithFocus();
    }
  };

  const handleCloseDialogs = () => {
    closeUploadDialogWithFocus();
    resetUploadState();
    navigate('/skus', { replace: true });
  };

  const handleCloseUploadError = () => {
    closeUploadErrorDialogWithFocus();
    resetUploadState();
  };

  // ---------------------------------------------------------------------------
  // 9. Focus Handlers for Dialogs
  // ---------------------------------------------------------------------------
  const {
    handleOpenDialog: openUploadDialogWithFocus,
    handleCloseDialog: closeUploadDialogWithFocus,
  } = useDialogFocusHandlers(
    setShowSuccessDialog,
    uploadImageButtonRef,
    () => showSuccessDialog
  );

  const {
    handleOpenDialog: openUploadErrorDialogWithFocus,
    handleCloseDialog: closeUploadErrorDialogWithFocus,
  } = useDialogFocusHandlers(
    setShowErrorDialog,
    uploadImageButtonRef,
    () => showErrorDialog
  );

  // ---------------------------------------------------------------------------
  // 10. Side Effects – open success or error dialogs after upload finishes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isHardFailure) {
      openUploadErrorDialogWithFocus();
      return;
    }

    if (uploadHasResults) {
      if (uploadFailedCount > 0) openUploadErrorDialogWithFocus();
      else openUploadDialogWithFocus();
    }
  }, [
    isHardFailure,
    uploadHasResults,
    uploadFailedCount,
    uploadSucceededCount,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => resetUploadState();
  }, []);

  // ---------------------------------------------------------------------------
  // 11. Early Returns — must come *after all hooks*
  // ---------------------------------------------------------------------------
  if (!isAllowed || selectedSkus.length === 0) {
    return <NotFoundPage />;
  }

  if (isHardFailure) {
    return (
      <SkuImageUploadErrorDialog
        open={showErrorDialog}
        onClose={handleCloseUploadError}
        error={uploadError}
        results={uploadResults}
        items={items}
      />
    );
  }

  if (!uploadLoading && isSuccess) {
    return (
      <SkuImageUploadSuccessDialog
        open={showSuccessDialog}
        onClose={handleCloseDialogs}
        stats={uploadStats}
        results={uploadResults}
        items={items}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // 12. Render Page
  // ---------------------------------------------------------------------------
  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          px: 3,
          pt: 2,
          pb: 1,
        }}
      >
        <GoBackButton sx={{ mb: 2 }} />

        <CustomTypography variant="h5" fontWeight={700}>
          Bulk Upload SKU Images
        </CustomTypography>

        <CustomTypography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Upload images for multiple SKUs in a single batch.
        </CustomTypography>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3 }}>
        {items.map((item: SkuImageUploadCardData, idx: number) => (
          <SkuImageUploadCard
            key={item.skuId}
            data={item}
            onChange={(next) => {
              const clone = [...items];
              clone[idx] = next;
              setItems(clone);
            }}
          />
        ))}
      </Box>

      {/* Sticky Bottom Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <CustomButton
          variant="contained"
          onClick={handleSubmit}
          ref={uploadImageButtonRef}
          disabled={uploadLoading || items.length === 0}
        >
          Upload All
        </CustomButton>
      </Box>
    </Box>
  );
};

export default SkuImageBulkUploadPage;
