import React from 'react';
import { useParams } from 'react-router-dom';
import { useProductDetail } from '../../../hooks';
import {
  CustomButton,
  DetailPage,
  MetadataSection,
  PriceDisplay,
} from '@components/index.ts';
import { Box, CardMedia } from '@mui/material';
import productPlaceholder from '../../../assets/Virility_CA.jpg';
import { formatDate } from '@utils/dateTimeUtils.ts';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Extract product ID from the URL
  const { product, isLoading, error, refetchProduct } = useProductDetail(id!);

  const pageTitle =
    product?.product_name && product.product_name.length > 50
      ? `${product.product_name.slice(0, 50)}... - Product Details`
      : `${product?.product_name || 'Product Details'} - Product Details`;

  // Prepare Metadata
  const metadata: Record<string, string | number> = product
    ? {
        Series: product.series ?? 'N/A',
        Brand: product.brand ?? 'N/A',
        Category: product.category ?? 'N/A',
        Barcode: product.barcode ?? 'N/A',
        'Market Region': product.market_region ?? 'N/A',
        Length: `${product.length_cm ?? 'N/A'} cm`,
        Width: `${product.width_cm ?? 'N/A'} cm`,
        Height: `${product.height_cm ?? 'N/A'} cm`,
        Weight: `${product.weight_g ?? 'N/A'} g`,
        Description: product.description ?? 'N/A',
        Status: product.status_name ?? 'N/A',
        'Location Type Name': product.location_type_name ?? 'N/A',
        'Location Name': product.location_name ?? 'N/A',
        'Status Date': formatDate(product.status_date) ?? 'N/A',
        'Created By': product.created_by_fullname ?? 'N/A',
        'Created At': formatDate(product.created_at) ?? 'N/A',
        'Updated By': product.updated_by_fullname ?? 'N/A',
        'Updated At': formatDate(product.updated_at) ?? 'N/A',
      }
    : {};

  return (
    <DetailPage
      title={pageTitle}
      isLoading={isLoading}
      error={error ?? undefined}
    >
      <Box mt={3}>
        <CustomButton onClick={() => refetchProduct()}>
          Refetch Products
        </CustomButton>
      </Box>

      {product && (
        <Box>
          {/* Product Image */}
          <CardMedia
            component="img"
            height="300"
            image={productPlaceholder || '/default-placeholder.png'} // Use placeholder if no image
            alt={product.product_name}
            sx={{ borderRadius: 2, marginBottom: 2, objectFit: 'cover' }}
          />

          {/* Metadata */}
          <MetadataSection data={metadata} />

          {/* Price Display */}
          <PriceDisplay prices={product.prices || []} />
        </Box>
      )}
    </DetailPage>
  );
};

export default ProductDetailPage;
