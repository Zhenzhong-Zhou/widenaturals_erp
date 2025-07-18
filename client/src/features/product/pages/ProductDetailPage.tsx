import { useState, type FC } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import Paper from '@mui/material/Paper';
import DetailPage from '@components/common/DetailPage';
import CustomButton from '@components/common/CustomButton';
import SkuDetailsSection from '@features/product/components/SkuDetailsSection';
import GoBackButton from '@components/common/GoBackButton';
import ZoomImageDialog from '@components/common/ZoomImageDialog';
import CustomTypography from '@components/common/CustomTypography';
import PriceDisplay from '@components/common/PriceDisplay';
import usePermissions from '@hooks/usePermissions';
import useSkuDetails from '@hooks/useSkuDetails';
import { formatImageUrl } from '@utils/formatImageUrl';
import type { ImageInfo, PricingInfo } from '../state';

const ProductDetailPage: FC = () => {
  const { skuId } = useParams<{ skuId: string }>();
  const [openZoom, setOpenZoom] = useState(false);

  const { permissions } = usePermissions();
  const {
    skuDetails,
    skuDetailsLoading,
    skuDetailsError,
    skuImages,
    primaryMainImage,
    refresh,
  } = useSkuDetails(skuId!);

  const canViewInactive = ['root_access', 'view_all_product_statuses'].some(
    (perm) => permissions.includes(perm)
  );

  const canViewAllPrices = ['root_access', 'view_all_pricing_types'].some(
    (perm) => permissions.includes(perm)
  );

  const filteredPrices = canViewAllPrices
    ? skuDetails && skuDetails.prices
    : (skuDetails.prices || []).filter((p: PricingInfo) =>
        ['msrp', 'retail'].includes(p.pricing_type.toLowerCase())
      );

  // Early guard: unauthorized access to non-active product
  if (skuDetails && skuDetails.status !== 'active' && !canViewInactive) {
    return <Navigate to="/404" replace />;
  }

  const zoomImage = skuImages.find((img: ImageInfo) => img.type === 'zoom');

  const displayImageUrl =
    openZoom && zoomImage?.image_url
      ? formatImageUrl(zoomImage.image_url)
      : formatImageUrl(primaryMainImage?.image_url ?? null);

  const pageTitle =
    skuDetails?.product?.displayName &&
    skuDetails.product.displayName.length > 50
      ? `${skuDetails.product.displayName.slice(0, 50)}... - Product Details`
      : `${skuDetails?.product?.displayName || 'Product Details'} - Product Details`;

  return (
    <DetailPage
      title={pageTitle}
      isLoading={skuDetailsLoading}
      error={skuDetailsError ?? undefined}
      sx={{ maxWidth: '100%', px: { xs: 2, md: 4 }, pb: 6 }}
    >
      {/* Action Buttons Row */}
      <Box
        mt={3}
        display="flex"
        gap={2}
        justifyContent="flex-start"
        flexWrap="wrap"
      >
        <CustomButton sx={{ minWidth: 160 }} onClick={refresh}>
          Refetch SKU Details
        </CustomButton>
        <GoBackButton sx={{ minWidth: 160 }} />
      </Box>

      {/* Main Content */}
      {skuDetails && (
        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={{ xs: 4, md: 6 }}
          alignItems="flex-start"
          mt={4}
        >
          {/* Left: Image */}
          <Box
            flexShrink={0}
            sx={{
              width: { xs: '100%', md: 320 },
              textAlign: 'center',
              pr: { md: 5 },
              mr: { md: 25 },
              ml: { md: 10 },
            }}
          >
            <CardMedia
              component="img"
              image={displayImageUrl}
              alt={primaryMainImage?.alt_text || skuDetails?.sku}
              onClick={() => setOpenZoom(true)}
            />
            {zoomImage && (
              <CustomTypography variant="caption" color="text.secondary" mt={1}>
                Click image to toggle zoom
              </CustomTypography>
            )}
            {/* Zoom Dialog (renders on click) */}
            <ZoomImageDialog
              open={openZoom}
              imageUrl={formatImageUrl(
                zoomImage?.image_url || primaryMainImage?.image_url || ''
              )}
              altText={primaryMainImage?.alt_text}
              onClose={() => setOpenZoom(false)}
            />
          </Box>

          {/* Right: Metadata + Pricing */}
          <Box flex={1} minWidth={0}>
            <SkuDetailsSection data={skuDetails} />

            <Box mt={5}>
              <CustomTypography variant="h5" mb={2}>
                Pricing
              </CustomTypography>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: (theme) => theme.palette.background.default,
                }}
              >
                <PriceDisplay prices={filteredPrices} />
              </Paper>
            </Box>
          </Box>
        </Box>
      )}
    </DetailPage>
  );
};

export default ProductDetailPage;
