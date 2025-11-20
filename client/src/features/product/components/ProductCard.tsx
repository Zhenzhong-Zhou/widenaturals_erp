import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomCard from '@components/common/CustomCard';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import { formatLabel } from '@utils/textUtils';
import type { SkuProductCard } from '@features/product/state';
import { formatImageUrl } from '@utils/formatImageUrl.ts';
import { Skeleton } from '@mui/material';

interface ProductCardProps {
  isLoading: boolean;
  product: SkuProductCard;
}

const ProductCard: FC<ProductCardProps> = ({ isLoading, product }) => {
  if (isLoading) {
    return (
      <Box sx={{ p: 1 }}>
        <CustomCard
          title={<Skeleton width="80%" />}
          imageUrl=""
          imageAlt=""
          actions={
            <>
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
            </>
          }
        >
          {[...Array(6)].map((_, idx) => (
            <Skeleton key={idx} width="100%" height={20} sx={{ mb: 1 }} />
          ))}
        </CustomCard>
      </Box>
    );
  }

  const {
    skuId,
    displayName,
    brand,
    series,
    status,
    barcode,
    msrpPrice,
    npnComplianceId,
    imageUrl,
    imageAltText,
  } = product;

  return (
    <Box
      sx={{
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <CustomCard
        title={displayName}
        imageUrl={formatImageUrl(imageUrl) || ''}
        imageAlt={imageAltText || displayName}
        actions={
          <>
            <CustomButton size="small" color="primary" variant="contained">
              Add to Cart
            </CustomButton>
            <CustomButton
              size="small"
              color="secondary"
              variant="outlined"
              to={`/skus/${skuId}`}
            >
              View Details
            </CustomButton>
          </>
        }
      >
        <CustomTypography variant="body2">
          Brand: {brand || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Series: {series || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Barcode: {barcode || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          NPN: {npnComplianceId || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          MSRP: {msrpPrice != null ? `$${msrpPrice.toFixed(2)}` : 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Status: {formatLabel(status)}
        </CustomTypography>
      </CustomCard>
    </Box>
  );
};

export default ProductCard;
