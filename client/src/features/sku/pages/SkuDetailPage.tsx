import { type FC, useCallback, useEffect, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import DetailPage from '@components/common/DetailPage';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import usePermissions from '@hooks/usePermissions';
import useSkuDetail from '@hooks/useSkuDetail';
import {
  flattenComplianceRecords,
  flattenPricingRecords,
  flattenSkuInfo,
} from '@features/sku/utils/flattenSkuDetailData';
import {
  SkuDetailRightPanel,
  SkuImageGallery,
} from '@features/sku/components/SkuDetail';
import { truncateText } from '@utils/textUtils';

const SkuDetailPage: FC = () => {
  /* ---------------------------------------------------------
  * Router + Context Hooks
  * --------------------------------------------------------- */
  const { skuId } = useParams<{ skuId: string }>();
  const { permissions } = usePermissions();
  
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
    loading,
    error,
    fetchSkuDetail,
    resetSkuDetail,
  } = useSkuDetail();
  
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
    if (skuId) refresh();
    return () => resetSkuDetail();
  }, [skuId]);
  
  /* ---------------------------------------------------------
   * Flattened structures for UI components
   * Memoized to avoid unnecessary re-renders
   * --------------------------------------------------------- */
  const flattenedSkuInfo = useMemo(
    () => (sku ? flattenSkuInfo(sku) : null),
    [sku]
  );
  
  const flattenedComplianceInfo = useMemo(
    () => (complianceRecords ? flattenComplianceRecords(complianceRecords) : null),
    [complianceRecords]
  );
  
  const flattenedPricingInfo = useMemo(
    () => (activePricing ? flattenPricingRecords(activePricing) : null),
    [activePricing]
  );
  
  /* ---------------------------------------------------------
   * Permission logic
   * --------------------------------------------------------- */
  const canViewInactive =
    permissions.includes('root_access') ||
    permissions.includes('view_all_product_statuses');
  
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
  const isInactive =
    sku?.status?.name !== "active" ||
    sku?.product?.status?.name !== "active";
  
  if (sku && isInactive && !canViewInactive) {
    return <Navigate to="/404" replace />;
  }
  
  /* ---------------------------------------------------------
   * Render
   * --------------------------------------------------------- */
  return (
    <DetailPage
      title={pageTitle}
      isLoading={loading}
      error={error ?? undefined}
      sx={{ maxWidth: '100%', px: { xs: 2, md: 4 }, pb: 6 }}
    >
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
        <CustomButton
          sx={{
            minWidth: 160,
            height: 44,            // FORCE SAME HEIGHT
            borderRadius: 22,      // MATCH YOUR DESIGN
          }}
          onClick={refresh}
        >
          Refresh SKU Details
        </CustomButton>
        
        <GoBackButton
          sx={{
            minWidth: 160,
            height: 44,            // SAME HEIGHT HERE
            borderRadius: 22,
          }}
        />
      </Stack>
      
      {/* Main Content */}
      {sku && (
        <Grid
          container
          spacing={2}
          mt={4}
          alignItems="flex-start"
        >
          
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
              display: "flex",
              flexDirection: "column",
              gap: 4
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
