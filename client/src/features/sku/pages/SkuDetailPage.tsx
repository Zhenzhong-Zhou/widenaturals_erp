import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useLocation } from 'react-router';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import {
  CustomButton,
  DetailPage,
  GoBackButton,
  Loading,
} from '@components/index';
import { NotFoundPage } from '@pages/system';
import {
  useSkuDetail,
  useStatusLookup,
} from '@hooks/index';
import { useHasPermission } from '@features/authorize/hooks';
import { useDialogFocusHandlers } from '@utils/hooks';
import {
  flattenComplianceRecords,
  flattenPricingRecords,
  flattenSkuInfo,
} from '@features/sku/utils';
import {
  transformFlattenedSkuToDimensionsFormValues,
  transformFlattenedSkuToMetadataFormValues,
} from '@features/sku/utils/skuTransformers';
import { truncateText } from '@utils/textUtils';
import {
  SkuDetailRightPanel,
  SkuImageGallery,
} from '@features/sku/components/SkuDetail';
import { UpdateSkuStatusDialog } from '@features/sku/components/UpdateSkuStatus';
import { UpdateSkuMetadataDialog } from '@features/sku/components/UpdateSkuMetadata';
import { UpdateSkuDimensionsDialog } from '@features/sku/components/UpdateSkuDimensions';
import { UpdateSkuIdentityDialog } from '@features/sku/components/UpdateSkuIdentity';
import { SkuImageUpdateDialog } from '@features/skuImage/components/UpdateImageForm';
import { SkuImageUploadDialog } from '@features/skuImage/components/UploadImageForm';

/**
 * Active dialog state for SKU detail page.
 */
type SkuDetailDialog =
  | 'edit-metadata'
  | 'edit-dimensions'
  | 'edit-identity'
  | 'edit-status'
  | 'upload-images'
  | 'edit-images'
  | null;

/**
 * Shared style for action buttons.
 */
const actionButtonStyle = {
  minWidth: 160,
  height: 44,
  borderRadius: 22,
};

const SkuDetailPage: FC = () => {
  /* ---------------------------------------------------------
   Router
  --------------------------------------------------------- */
  
  const { skuId } = useParams<{ skuId: string }>();
  const location = useLocation();
  
  const cameFromUpload = location.state?.fromUpload === true;
  
  if (!skuId) {
    return <NotFoundPage />;
  }
  
  /* ---------------------------------------------------------
   Data Hooks
  --------------------------------------------------------- */
  
  const {
    sku,
    product,
    imageGroups,
    activePricing,
    complianceRecords,
    loading: skuDetailLoading,
    error: skuDetailError,
    fetchSkuDetail,
    resetSkuDetailState,
  } = useSkuDetail();
  
  const statusLookup = useStatusLookup();
  
  /* ---------------------------------------------------------
   Permissions
  --------------------------------------------------------- */
  
  const hasPermission = useHasPermission();
  
  const canViewInactive = hasPermission('view_all_product_statuses');
  const canUpdateMetadata = hasPermission('update_sku_metadata');
  const canUpdateStatus = hasPermission('update_sku_status');
  const canUpdateDimension = hasPermission('update_sku_dimension');
  const canUpdateIdentity = hasPermission('update_sku_identity');
  const canUploadImages = hasPermission('update_sku_metadata');
  const canUpdateImages = hasPermission('update_sku_images');
  
  /* ---------------------------------------------------------
   Dialog State
  --------------------------------------------------------- */
  
  const [activeDialog, setActiveDialog] = useState<SkuDetailDialog>(null);
  
  /* ---------------------------------------------------------
   Button Refs (focus restore)
  --------------------------------------------------------- */
  
  const metadataButtonRef = useRef<HTMLButtonElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const dimensionsButtonRef = useRef<HTMLButtonElement>(null);
  const identityButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  
  /* ---------------------------------------------------------
   Dialog Handlers
  --------------------------------------------------------- */
  
  const metadataDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-metadata' : null),
    metadataButtonRef,
    () => activeDialog === 'edit-metadata'
  );
  
  const statusDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-status' : null),
    statusButtonRef,
    () => activeDialog === 'edit-status'
  );
  
  const dimensionsDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-dimensions' : null),
    dimensionsButtonRef,
    () => activeDialog === 'edit-dimensions'
  );
  
  const identityDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-identity' : null),
    identityButtonRef,
    () => activeDialog === 'edit-identity'
  );
  
  const imageDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-images' : null),
    imageButtonRef,
    () => activeDialog === 'edit-images'
  );
  
  const uploadDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'upload-images' : null),
    uploadButtonRef,
    () => activeDialog === 'upload-images'
  );
  
  /* ---------------------------------------------------------
   Data Lifecycle
  --------------------------------------------------------- */
  
  const refresh = useCallback(() => {
    if (skuId) fetchSkuDetail(skuId);
  }, [skuId, fetchSkuDetail]);
  
  useEffect(() => {
    refresh();
    return () => resetSkuDetailState();
  }, [refresh, resetSkuDetailState]);
  
  /* ---------------------------------------------------------
   Derived Data
  --------------------------------------------------------- */
  
  const flattenedSkuInfo = useMemo(
    () => (sku ? flattenSkuInfo(sku) : null),
    [sku]
  );
  
  const flattenedComplianceInfo = useMemo(
    () =>
      complianceRecords
        ? flattenComplianceRecords(complianceRecords)
        : null,
    [complianceRecords]
  );
  
  const flattenedPricingInfo = useMemo(
    () =>
      activePricing
        ? flattenPricingRecords(activePricing)
        : null,
    [activePricing]
  );
  
  const pageTitle = useMemo(() => {
    const name = product?.displayName;
    const base = truncateText(name, 50) || 'Product Details';
    return `${base} - Product Details`;
  }, [product]);
  
  /* ---------------------------------------------------------
   Access Guard
  --------------------------------------------------------- */
  
  const isInactive = sku?.status?.name !== 'active';
  
  if (sku && isInactive && !canViewInactive) {
    return <Navigate to="/404" replace />;
  }
  
  if (!product) {
    return (
      <Loading
        variant="dotted"
        message="Loading product details..."
      />
    );
  }
  
  /* ---------------------------------------------------------
   Render
  --------------------------------------------------------- */
  
  return (
    <DetailPage
      title={pageTitle}
      isLoading={skuDetailLoading}
      error={skuDetailError ?? undefined}
      sx={{ maxWidth: '100%', px: { xs: 2, md: 4 }, pb: 6 }}
    >
      {/* ---------------------------------------------------------
          Dialogs
      --------------------------------------------------------- */}
      
      {skuId && (
        <>
          <UpdateSkuMetadataDialog
            open={activeDialog === 'edit-metadata'}
            onClose={metadataDialogHandlers.handleCloseDialog}
            skuId={skuId}
            skuCode={flattenedSkuInfo?.sku ?? ''}
            initialValues={transformFlattenedSkuToMetadataFormValues(
              flattenedSkuInfo
            )}
            onSuccess={refresh}
          />
          
          <UpdateSkuStatusDialog
            open={activeDialog === 'edit-status'}
            onClose={statusDialogHandlers.handleCloseDialog}
            skuId={skuId}
            skuCode={flattenedSkuInfo?.sku ?? ''}
            onSuccess={refresh}
            statusLookup={statusLookup}
            currentStatusId={flattenedSkuInfo?.statusId}
            currentStatusName={flattenedSkuInfo?.statusName}
          />
          
          <UpdateSkuDimensionsDialog
            open={activeDialog === 'edit-dimensions'}
            onClose={dimensionsDialogHandlers.handleCloseDialog}
            skuId={skuId}
            skuCode={flattenedSkuInfo?.sku ?? ''}
            initialValues={transformFlattenedSkuToDimensionsFormValues(
              flattenedSkuInfo
            )}
            onSuccess={refresh}
          />
          
          <UpdateSkuIdentityDialog
            open={activeDialog === 'edit-identity'}
            onClose={identityDialogHandlers.handleCloseDialog}
            skuId={skuId}
            skuCode={flattenedSkuInfo?.sku ?? ''}
            onSuccess={refresh}
            initialValues={{
              sku: flattenedSkuInfo?.sku ?? '',
              barcode: flattenedSkuInfo?.barcode ?? '',
            }}
          />
        </>
      )}
      
      <SkuImageUpdateDialog
        open={activeDialog === 'edit-images'}
        onClose={imageDialogHandlers.handleCloseDialog}
        skuId={skuId}
        skuCode={flattenedSkuInfo?.sku ?? ''}
        displayProductName={product?.displayName ?? ''}
        imageGroups={imageGroups}
        onSuccess={refresh}
      />
      
      <SkuImageUploadDialog
        open={activeDialog === 'upload-images'}
        onClose={uploadDialogHandlers.handleCloseDialog}
        skuId={skuId}
        skuCode={flattenedSkuInfo?.sku ?? ''}
        displayProductName={product?.displayName ?? ''}
        onSuccess={refresh}
      />
      
      {/* ---------------------------------------------------------
          Header Actions
      --------------------------------------------------------- */}
      
      <Stack
        direction="row"
        spacing={2}
        mt={3}
        mb={1}
        flexWrap="wrap"
        justifyContent="flex-end"
      >
        {canUpdateMetadata && (
          <CustomButton
            sx={actionButtonStyle}
            ref={metadataButtonRef}
            onClick={metadataDialogHandlers.handleOpenDialog}
          >
            Edit Metadata
          </CustomButton>
        )}
        
        {canUpdateStatus && (
          <CustomButton
            sx={actionButtonStyle}
            color="secondary"
            ref={statusButtonRef}
            onClick={statusDialogHandlers.handleOpenDialog}
          >
            Update SKU Status
          </CustomButton>
        )}
        
        {canUpdateDimension && (
          <CustomButton
            sx={actionButtonStyle}
            ref={dimensionsButtonRef}
            onClick={dimensionsDialogHandlers.handleOpenDialog}
          >
            Edit Dimensions
          </CustomButton>
        )}
        
        {canUpdateIdentity && (
          <CustomButton
            sx={actionButtonStyle}
            ref={identityButtonRef}
            onClick={identityDialogHandlers.handleOpenDialog}
          >
            Edit Identity
          </CustomButton>
        )}
        
        {canUpdateImages && (
          <CustomButton
            sx={actionButtonStyle}
            color="primary"
            ref={imageButtonRef}
            onClick={imageDialogHandlers.handleOpenDialog}
          >
            Edit SKU Images
          </CustomButton>
        )}
        
        {canUploadImages && (
          <CustomButton
            sx={actionButtonStyle}
            color="primary"
            ref={uploadButtonRef}
            onClick={uploadDialogHandlers.handleOpenDialog}
          >
            Add Images
          </CustomButton>
        )}
        
        <CustomButton sx={actionButtonStyle} onClick={refresh}>
          Refresh SKU Details
        </CustomButton>
        
        <GoBackButton
          sx={actionButtonStyle}
          fallbackTo={cameFromUpload ? '/skus' : undefined}
        />
      </Stack>
      
      {/* ---------------------------------------------------------
          Main Content
      --------------------------------------------------------- */}
      
      {sku && (
        <Grid container spacing={2} mt={4}>
          {/* Image Gallery */}
          
          <Grid size={{ xs: 12, md: 4 }} sx={{ pr: { md: 4 } }}>
            <SkuImageGallery images={imageGroups} maxThumbsDesktop={5} />
          </Grid>
          
          {/* Info Panel */}
          
          <Grid
            size={{ xs: 12, md: 8 }}
            sx={{
              pl: { md: 6 },
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <SkuDetailRightPanel
              product={product}
              skuInfo={flattenedSkuInfo}
              compliance={flattenedComplianceInfo}
              pricing={flattenedPricingInfo}
            />
          </Grid>
        </Grid>
      )}
    </DetailPage>
  );
};

export default SkuDetailPage;
