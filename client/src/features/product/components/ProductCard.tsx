import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomCard from '@components/common/CustomCard';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import PriceDisplay from '@components/common/PriceDisplay';
import { formatLabel } from '@utils/textUtils';
import type { GeneralProductInfo } from '@features/product/state';

interface ProductCardProps {
  product: GeneralProductInfo; // Use the subset type
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const {
    id,
    product_name,
    series,
    brand,
    category,
    npn_info,
    barcode,
    market_region,
    prices,
    status_name,
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
        title={product_name}
        imageUrl={''}
        actions={
          <>
            <CustomButton size="small" color="primary" variant="contained">
              Add to Cart
            </CustomButton>
            <CustomButton
              size="small"
              color="secondary"
              variant="outlined"
              to={`/products/${id}`}
            >
              View Details
            </CustomButton>
          </>
        }
      >
        <CustomTypography variant="body2">
          Series: {series || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Brand: {brand || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Category: {category || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          NPN: {npn_info[0]?.npn || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Barcode: {barcode || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Region: {market_region || 'N/A'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Status: {formatLabel(status_name)}
        </CustomTypography>
        {/* Price Display */}
        <PriceDisplay prices={prices} />
      </CustomCard>
    </Box>
  );
};

export default ProductCard;
