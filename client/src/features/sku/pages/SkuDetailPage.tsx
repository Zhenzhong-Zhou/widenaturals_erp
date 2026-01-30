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
import {
  SkuDetailRightPanel,
  SkuImageGallery,
} from '@features/sku/components/SkuDetail';
import { UpdateSkuStatusDialog } from '@features/sku/components/UpdateSkuStatusForm';
import { truncateText } from '@utils/textUtils';

/**
 * SKU Detail Page
 *
 * Displays all information about a single SKU including:
 * - images
 * - product metadata
 * - compliance records
 * - pricing
 *
 * Also provides:
 * - permission-based access control
 * - ability to update SKU status
 * - refresh controls
 *
 * URL: /skus/:skuId
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
    images,
    primaryImage,
    thumbnails,
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
   * Local UI State for Dialog
   * --------------------------------------------------------- */
  const [openStatusDialog, setOpenStatusDialog] = useState(false);

  // Setup open/close with focus restoration for accessibility
  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setOpenStatusDialog,
    createButtonRef,
    () => openStatusDialog
  );

  /* ---------------------------------------------------------
   * Fetching Logic
   * - refresh function re-fetches SKU detail
   * - load on mount + whenever skuId changes
   * - cleanup resets global store slice on unmount
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
  
  const canViewInactive = hasPermission(
    'view_all_product_statuses'
  );
  
  const canUpdateStatus = hasPermission(
    'update_sku_status'
  );

  /* ---------------------------------------------------------
   * Page title (memoized)
   * --------------------------------------------------------- */
  const pageTitle = useMemo(() => {
    const name = product?.displayName;
    const base = truncateText(name, 50) || 'Product Details';
    return `${base} - Product Details`;
  }, [product]);

  /* ---------------------------------------------------------
   * Access Guard:
   * If both SKU and parent product are inactive → deny access
   * unless user has explicit permission
   * --------------------------------------------------------- */
  const isInactive = sku?.status?.name !== 'active';

  // Prevent access to inactive SKUs unless user has proper permissions
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
   * Render
   * --------------------------------------------------------- */
  return (
    <DetailPage
      title={pageTitle}
      isLoading={skuDetailLoading}
      error={skuDetailError ?? undefined}
      sx={{ maxWidth: '100%', px: { xs: 2, md: 4 }, pb: 6 }}
    >
      {/* Dialog */}
      {skuId && (
        <UpdateSkuStatusDialog
          open={openStatusDialog}
          onClose={handleCloseDialog}
          skuId={skuId}
          skuCode={flattenedSkuInfo?.sku ?? ''}
          onSuccess={refresh}
          statusLookup={statusLookup}
        />
      )}

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
        {canUpdateStatus && (
          <CustomButton
            sx={{
              minWidth: 160,
              height: 44,
              borderRadius: 22,
            }}
            color="secondary"
            ref={createButtonRef}
            onClick={handleOpenDialog}
          >
            Update SKU Status
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
              images={images}
              thumbnails={thumbnails}
              primaryImage={primaryImage}
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
