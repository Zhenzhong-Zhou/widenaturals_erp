import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import GoBackButton from '@components/common/GoBackButton';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import NoDataFound from '@components/common/NoDataFound';
import { NotFoundPage } from '@pages/system';
import useProductDetail from '@hooks/useProductDetail';
import useStatusLookup from '@hooks/useStatusLookup';
import { usePagePermissionState } from '@features/authorize/hooks';
import { useDialogFocusHandlers } from '@utils/hooks';
import { flattenProductDetail } from '@features/product/utils';
import {
  ProductDetailAuditSection,
  ProductDetailInformationSection,
  ProductDetailStatusSection,
} from '@features/product/components/ProductDetail';
import {
  ProductUpdateInfoDialog,
  UpdateProductStatusDialog,
} from '@features/product/components/UpdateProductForm';

const ProductDetailPage = () => {
  // --------------------------------------
  // 1. Route Params (Early Exit)
  // --------------------------------------
  const { productId } = useParams<{ productId: string }>();

  if (!productId) {
    return <NotFoundPage />;
  }

  // --------------------------------------
  // 2. Data Hooks
  // --------------------------------------
  const {
    product: selectedProduct,
    loading: isLoadingProductDetail,
    error: productDetailError,
    isEmpty: isProductDetailEmpty,
    fetchProductDetail: fetchProductDetailById,
    resetProductDetailState,
  } = useProductDetail();
  
  const statusLookup = useStatusLookup();
  
  // --------------------------------------
  // 3. Permission Hooks
  // --------------------------------------
  const canUpdateStatus = usePagePermissionState(['update_product_status']);
  const canUpdateInfo = usePagePermissionState(['update_product_info']);

  // --------------------------------------
  // 4. UI State (Dialogs)
  // --------------------------------------
  const [showUpdateInfoDialog, setShowUpdateInfoDialog] = useState(false);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);

  // --------------------------------------
  // 5. Refs (Focus Restore)
  // --------------------------------------
  const updateInfoButtonRef = useRef<HTMLButtonElement | null>(null);
  const updateStatusButtonRef = useRef<HTMLButtonElement | null>(null);

  // --------------------------------------
  // 6. Dialog Focus Handlers
  // --------------------------------------
  const {
    handleOpenDialog: openInfoDialogWithFocus,
    handleCloseDialog: closeInfoDialogWithFocus,
  } = useDialogFocusHandlers(
    setShowUpdateInfoDialog,
    updateInfoButtonRef,
    () => showUpdateInfoDialog
  );

  const {
    handleOpenDialog: openStatusDialogWithFocus,
    handleCloseDialog: closeStatusDialogWithFocus,
  } = useDialogFocusHandlers(
    setShowUpdateStatusDialog,
    updateStatusButtonRef,
    () => showUpdateStatusDialog
  );

  // --------------------------------------
  // 7. Derived Values & Callbacks
  // --------------------------------------
  const flattenProductDetails = useMemo(() => {
    if (!selectedProduct) return null;
    return flattenProductDetail(selectedProduct);
  }, [selectedProduct]);

  const refreshProductDetails = useCallback(() => {
    if (productId) fetchProductDetailById(productId);
  }, [productId, fetchProductDetailById]);

  // --------------------------------------
  // 8. Effects
  // --------------------------------------
  useEffect(() => {
    refreshProductDetails();
    return () => resetProductDetailState();
  }, [refreshProductDetails, resetProductDetailState]);

  // -----------------------------
  // Render: Product Detail Page
  // -----------------------------
  return (
    <Box sx={{ p: 4 }}>
      {/* --------------------------------------------- */}
      {/* PAGE HEADER: Title + Back Button + Actions     */}
      {/* --------------------------------------------- */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        {/* LEFT: Back Navigation + Product Title */}
        <Stack direction="row" spacing={2} alignItems="center">
          <GoBackButton label="Back to Product List" fallbackTo="/products" />

          {/* Render product name when detail is loaded */}
          {flattenProductDetails && (
            <CustomTypography variant="h5" fontWeight={700}>
              {flattenProductDetails.name}
            </CustomTypography>
          )}
        </Stack>

        {/* RIGHT: Page Action Buttons */}
        <Stack direction="row" spacing={1}>
          {/* Always available Refresh button */}
          <CustomButton
            variant="outlined"
            color="primary"
            onClick={refreshProductDetails}
          >
            Refresh
          </CustomButton>

          {/* Actions depend on permission + data availability */}
          {!isProductDetailEmpty && !isLoadingProductDetail && (
            <>
              {/* Update Info Button (permission-protected) */}
              {canUpdateInfo.isAllowed && (
                <CustomButton
                  variant="contained"
                  color="primary"
                  ref={updateInfoButtonRef}
                  onClick={openInfoDialogWithFocus}
                >
                  Update Info
                </CustomButton>
              )}

              {/* Update Status Button (permission-protected) */}
              {canUpdateStatus.isAllowed && (
                <CustomButton
                  variant="contained"
                  color="secondary"
                  ref={updateStatusButtonRef}
                  onClick={openStatusDialogWithFocus}
                >
                  Update Status
                </CustomButton>
              )}
            </>
          )}
        </Stack>
      </Stack>

      {/* --------------------------------------------- */}
      {/* PAGE CONTENT: Loading / Error / Empty / Detail */}
      {/* --------------------------------------------- */}

      {/* Loading state */}
      {isLoadingProductDetail && (
        <Loading variant="dotted" message="Loading Product Details..." />
      )}

      {/* Error state */}
      {productDetailError && <ErrorMessage message={productDetailError} />}

      {/* Empty state */}
      {isProductDetailEmpty && (
        <NoDataFound message="No product details found." />
      )}

      {/* Main product detail sections */}
      {flattenProductDetails && (
        <>
          <ProductDetailInformationSection product={flattenProductDetails} />
          <ProductDetailStatusSection product={flattenProductDetails} />
          <ProductDetailAuditSection product={flattenProductDetails} />
        </>
      )}

      {/* --------------------------------------------- */}
      {/* UPDATE INFO DIALOG (controlled with focus)     */}
      {/* --------------------------------------------- */}
      {flattenProductDetails && (
        <ProductUpdateInfoDialog
          open={showUpdateInfoDialog}
          onClose={closeInfoDialogWithFocus}
          onSuccess={refreshProductDetails}
          productId={productId!}
          productDetails={flattenProductDetails}
        />
      )}

      {/* --------------------------------------------- */}
      {/* UPDATE STATUS DIALOG (controlled with focus)   */}
      {/* --------------------------------------------- */}
      {flattenProductDetails && (
        <UpdateProductStatusDialog
          open={showUpdateStatusDialog}
          onClose={closeStatusDialogWithFocus}
          onSuccess={refreshProductDetails}
          productId={productId}
          productName={flattenProductDetails.name}
          statusLookup={statusLookup}
        />
      )}
    </Box>
  );
};

export default ProductDetailPage;
