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
import DetailPage from '@components/common/DetailPage';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import { NotFoundPage } from '@pages/system';
import Loading from '@components/common/Loading';
import { useHasPermission } from '@features/authorize/hooks';
import useSkuDetail from '@hooks/useSkuDetail';
import useStatusLookup from '@hooks/useStatusLookup';
import { useDialogFocusHandlers } from '@utils/hooks';
import {
  flattenComplianceRecords,
  flattenPricingRecords,
  flattenSkuInfo,
} from '@features/sku/utils';
import { truncateText } from '@utils/textUtils';
import {
  SkuDetailRightPanel,
  SkuImageGallery,
} from '@features/sku/components/SkuDetail';
import { UpdateSkuStatusDialog } from '@features/sku/components/UpdateSkuStatusForm';
import { UpdateSkuMetadataDialog } from '@features/sku/components/UpdateSkuMetadata';
import { UpdateSkuDimensionsDialog } from '@features/sku/components/UpdateSkuDimensions';
import { UpdateSkuIdentityDialog } from '@features/sku/components/UpdateSkuIdentity';
import { SkuImageUpdateDialog } from '@features/skuImage/components/UpdateImageForm';
import { SkuImageUploadDialog } from '@features/skuImage/components/UploadImageForm';
import {
  transformFlattenedSkuToDimensionsFormValues,
  transformFlattenedSkuToMetadataFormValues,
} from '@features/sku/utils/skuTransformers';

/**
 * Represents the currently active dialog on the SKU detail page.
 *
 * Ensures only one dialog is open at a time.
 * Used for centralized dialog state + focus restoration handling.
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
 * SKU Detail Page
 *
 * Responsibilities:
 * - Fetch and display complete SKU detail view
 * - Render image gallery, metadata, compliance, and pricing sections
 * - Provide permission-gated actions (status update, image management)
 * - Centralize dialog control using `activeDialog`
 * - Restore focus correctly after dialog close (accessibility)
 *
 * Route: /skus/:skuId
 */
const SkuDetailPage: FC = () => {
  /* ---------------------------------------------------------
   * Router + Context Hooks
   * --------------------------------------------------------- */
  const { skuId } = useParams<{ skuId: string }>();

  const location = useLocation();
  const cameFromUpload = location.state?.fromUpload === true;

  if (!skuId) {
    return <NotFoundPage />;
  }

  /* ---------------------------------------------------------
   * SKU detail hook (provides all data & fetch helpers)
   * --------------------------------------------------------- */
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

  const createButtonRef = useRef<HTMLButtonElement>(null);

  const statusLookup = useStatusLookup();
  
  /* ---------------------------------------------------------
   * Dialog State + Focus Management
   *
   * - `activeDialog` ensures only one dialog is open at a time.
   * - Each dialog trigger button keeps a ref for accessibility.
   * - `useDialogFocusHandlers` restores focus to the triggering
   *   button when the dialog closes.
   * - Open state is derived from `activeDialog` rather than
   *   separate booleans for scalability.
   * --------------------------------------------------------- */
  const [activeDialog, setActiveDialog] = useState<SkuDetailDialog>(null);
  
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const metadataButtonRef = useRef<HTMLButtonElement>(null);
  const dimensionsButtonRef = useRef<HTMLButtonElement>(null);
  const identityButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  
  // Per-dialog focus-aware open/close handlers
  const statusDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-status' : null),
    statusButtonRef,
    () => activeDialog === 'edit-status'
  );
  
  const metadataDialogHandlers = useDialogFocusHandlers(
    (open) => setActiveDialog(open ? 'edit-metadata' : null),
    metadataButtonRef,
    () => activeDialog === 'edit-metadata'
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
   * Data Lifecycle
   * - Fetch SKU detail on mount and skuId change
   * - Provide manual refresh
   * - Reset slice state on unmount
   * --------------------------------------------------------- */
  const refresh = useCallback(() => {
    if (skuId) fetchSkuDetail(skuId);
  }, [skuId, fetchSkuDetail]);

  useEffect(() => {
    refresh();
    return () => resetSkuDetailState();
  }, [refresh, resetSkuDetailState]);
  
  /* ---------------------------------------------------------
   * Flattened structures for UI components
   * Memoized to avoid unnecessary re-renders
   * --------------------------------------------------------- */
  const flattenedSkuInfo = useMemo(
    () => (sku ? flattenSkuInfo(sku) : null),
    [sku]
  );

  const flattenedComplianceInfo = useMemo(
    () =>
      complianceRecords ? flattenComplianceRecords(complianceRecords) : null,
    [complianceRecords]
  );

  const flattenedPricingInfo = useMemo(
    () => (activePricing ? flattenPricingRecords(activePricing) : null),
    [activePricing]
  );

  /* ---------------------------------------------------------
   * Permission logic
   * --------------------------------------------------------- */
  const hasPermission = useHasPermission();

  const canViewInactive = hasPermission('view_all_product_statuses');

  const canUpdateMetadata = hasPermission('update_sku_metadata');
  
  const canUpdateStatus = hasPermission('update_sku_status');
 
  const canUpdateDimension = hasPermission('update_sku_dimension');
 
  const canUpdateIdentity = hasPermission('update_sku_identity');
  
  const canUploadImages = hasPermission('update_sku_metadata');
  
  const canUpdateImages = hasPermission('update_sku_images');

  /* ---------------------------------------------------------
   * Page title (memoized)
   * --------------------------------------------------------- */
  const pageTitle = useMemo(() => {
    const name = product?.displayName;
    const base = truncateText(name, 50) || 'Product Details';
    return `${base} - Product Details`;
  }, [product]);
  
  /* ---------------------------------------------------------
   * Access Guard
   * Deny access to inactive SKUs unless user has permission
   * --------------------------------------------------------- */
  const isInactive = sku?.status?.name !== 'active';

  // Prevent access to inactive SKUs unless user has proper permissions
  if (sku && isInactive && !canViewInactive) {
    return <Navigate to="/404" replace />;
  }

  if (!product) {
    return <Loading variant="dotted" message="Loading product details..." />;
  }

  /* ---------------------------------------------------------
   * Render
   * --------------------------------------------------------- */
  return (
    <DetailPage
      title={pageTitle}
      isLoading={skuDetailLoading}
      error={skuDetailError ?? undefined}
      sx={{ maxWidth: '100%', px: { xs: 2, md: 4 }, pb: 6 }}
    >
      {/* Metadata Dialog */}
      {skuId && (
        <UpdateSkuMetadataDialog
          open={activeDialog === 'edit-metadata'}
          onClose={metadataDialogHandlers.handleCloseDialog}
          skuId={skuId}
          skuCode={flattenedSkuInfo?.sku ?? ''}
          initialValues={transformFlattenedSkuToMetadataFormValues(flattenedSkuInfo)}
          onSuccess={refresh}
        />
      )}
      
      {/* Status Dialog */}
      {skuId && (
        <UpdateSkuStatusDialog
          open={activeDialog === 'edit-status'}
          onClose={statusDialogHandlers.handleCloseDialog}
          skuId={skuId}
          skuCode={flattenedSkuInfo?.sku ?? ''}
          onSuccess={refresh}
          statusLookup={statusLookup}
        />
      )}
      
      {/* Dimensions Dialog */}
      {skuId && (
        <UpdateSkuDimensionsDialog
          open={activeDialog === 'edit-dimensions'}
          onClose={dimensionsDialogHandlers.handleCloseDialog}
          skuId={skuId}
          skuCode={flattenedSkuInfo?.sku ?? ''}
          initialValues={transformFlattenedSkuToDimensionsFormValues(flattenedSkuInfo)}
          onSuccess={refresh}
        />
      )}
      
      {/* Identity Dialog */}
      {skuId && (
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
      )}
      
      {/* Edit Images Dialog */}
      <SkuImageUpdateDialog
        open={activeDialog === 'edit-images'}
        onClose={imageDialogHandlers.handleCloseDialog}
        skuId={skuId}
        skuCode={flattenedSkuInfo?.sku ?? ''}
        displayProductName={product?.displayName ?? ''}
        imageGroups={imageGroups}
        onSuccess={refresh}
      />
      
      {/* Upload Images Dialog */}
      <SkuImageUploadDialog
        open={activeDialog === 'upload-images'}
        onClose={uploadDialogHandlers.handleCloseDialog}
        skuId={skuId}
        skuCode={flattenedSkuInfo?.sku ?? ''}
        displayProductName={product?.displayName ?? ''}
        onSuccess={refresh}
      />
      
      {/* Header Actions */}
      <Stack
        direction="row"
        spacing={2}
        mt={3}
        mb={1}
        flexWrap="wrap"
        alignItems="center"
        justifyContent="flex-end"
      >
        {canUpdateMetadata && (
          <CustomButton
            sx={{ minWidth: 160, height: 44, borderRadius: 22 }}
            ref={metadataButtonRef}
            onClick={metadataDialogHandlers.handleOpenDialog}
          >
            Edit Metadata
          </CustomButton>
        )}
        
        {canUpdateStatus && (
          <CustomButton
            sx={{
              minWidth: 160,
              height: 44,
              borderRadius: 22,
            }}
            color="secondary"
            ref={createButtonRef}
            onClick={statusDialogHandlers.handleOpenDialog}
          >
            Update SKU Status
          </CustomButton>
        )}
        
        {canUpdateDimension && (
          <CustomButton
            sx={{ minWidth: 160, height: 44, borderRadius: 22 }}
            ref={dimensionsButtonRef}
            onClick={dimensionsDialogHandlers.handleOpenDialog}
          >
            Edit Dimensions
          </CustomButton>
        )}
        
        {canUpdateIdentity && (
          <CustomButton
            sx={{ minWidth: 160, height: 44, borderRadius: 22 }}
            ref={identityButtonRef}
            onClick={identityDialogHandlers.handleOpenDialog}
          >
            Edit Identity
          </CustomButton>
        )}
        
        {canUpdateImages && (
          <CustomButton
            sx={{
              minWidth: 160,
              height: 44,
              borderRadius: 22,
            }}
            color="primary"
            onClick={imageDialogHandlers.handleOpenDialog}
          >
            Edit SKU Images
          </CustomButton>
        )}
        
        {canUploadImages && (
          <CustomButton
            sx={{
              minWidth: 160,
              height: 44,
              borderRadius: 22
          }}
            color="primary"
            ref={uploadButtonRef}
            onClick={uploadDialogHandlers.handleOpenDialog}
          >
            Add Images
          </CustomButton>
        )}
        
        <CustomButton
          sx={{
            minWidth: 160,
            height: 44, // FORCE SAME HEIGHT
            borderRadius: 22, // MATCH YOUR DESIGN
          }}
          onClick={refresh}
        >
          Refresh SKU Details
        </CustomButton>

        <GoBackButton
          sx={{
            minWidth: 160,
            height: 44, // SAME HEIGHT HERE
            borderRadius: 22,
          }}
          fallbackTo={cameFromUpload ? '/skus' : undefined}
        />
      </Stack>

      {/* Main Content */}
      {sku && (
        <Grid container spacing={2} mt={4} alignItems="flex-start">
          {/* LEFT — Image Gallery */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ pr: { md: 4 } }}>
            <SkuImageGallery
              images={imageGroups}
              maxThumbsDesktop={5}
            />
          </Grid>

          {/* RIGHT — All Info Sections */}
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
