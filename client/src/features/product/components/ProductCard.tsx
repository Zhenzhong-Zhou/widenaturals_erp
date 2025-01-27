import { FC } from 'react';
import { Button } from "@mui/material";
import { CustomCard, PriceDisplay } from '@components/index';
import { GeneralProductInfo } from '../state/productTypes.ts';
import productPlaceholder from '../../../assets/Virility_CA.jpg';

interface ProductCardProps {
  product: GeneralProductInfo; // Use the subset type
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const { product_name, series, brand, category, barcode, market_region, prices, status_name } = product;
  
  return (
    <CustomCard
      title={product_name}
      imageUrl={productPlaceholder}
      actions={
        <>
          <Button size="small" color="primary" variant="contained">
            Add to Cart
          </Button>
          <Button size="small" color="secondary" variant="outlined">
            View Details
          </Button>
        </>
      }
    >
      <p>Series: {series || 'N/A'}</p>
      <p>Brand: {brand || 'N/A'}</p>
      <p>Category: {category || 'N/A'}</p>
      <p>Category: {barcode || 'N/A'}</p>
      <p>market_region: {market_region || 'N/A'}</p>
      <p>Status: {status_name}</p>
      {/* Price Display */}
      <PriceDisplay prices={prices} />
    </CustomCard>
  );
};

export default ProductCard;
