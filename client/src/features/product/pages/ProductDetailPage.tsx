import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NavigateBackButton from '@components/common/NavigateBackButton';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import useProductDetail from '@hooks/useProductDetail';
import NoDataFound from '@components/common/NoDataFound';
import { flattenProductDetail } from '@features/product/utils/flattenProductDetail';
import {
  ProductDetailAuditSection,
  ProductDetailInformationSection,
  ProductDetailStatusSection,
} from '@features/product/components/ProductDetail';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  
  const {
    product: selectedProduct,
    loading: isLoadingProductDetail,
    error: productDetailError,
    isEmpty: isProductDetailEmpty,
    fetchProductDetail: fetchProductDetailById,
    resetProductDetail: resetProductDetailState,
  } = useProductDetail();
  
  const flattenProductDetails = useMemo(
    () => flattenProductDetail(selectedProduct),
    [selectedProduct]
  );
  
  const refreshProductDetails = useCallback(() => {
    if (productId) fetchProductDetailById(productId);
  }, [productId, fetchProductDetailById]);
  
  // -----------------------------
  // Fetch on mount + cleanup
  // -----------------------------
  useEffect(() => {
    refreshProductDetails();
    return () => {
      resetProductDetailState();
    };
  }, [productId, refreshProductDetails, resetProductDetailState]);
  
  
  // -----------------------------
  // Render: Product Detail
  // -----------------------------
  return (
    <Box sx={{ p: 4 }}>
      {/* PAGE HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        {/* LEFT: Back + Title */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Single back button */}
          <NavigateBackButton
            label="Back to Product List"
            fallbackTo="/products"
          />
          
          {/* Title */}
          {flattenProductDetails && (
            <CustomTypography variant="h5" fontWeight={700}>
              {flattenProductDetails.name}
            </CustomTypography>
          )}
        </Stack>
        
        {/* RIGHT: ACTIONS */}
        <Stack direction="row" spacing={1}>
          <CustomButton
            variant="outlined"
            color="primary"
            onClick={refreshProductDetails}
          >
            Refresh
          </CustomButton>
          
          {/* Future actions */}
          <CustomButton
            variant="contained"
            color="primary"
          >
            Edit
          </CustomButton>
        </Stack>
      </Stack>
      
      {/* PAGE CONTENT */}
      {isLoadingProductDetail && (
        <Loading variant="dotted" message="Loading Product Details..." />
      )}
      
      {productDetailError && <ErrorMessage message={productDetailError} />}
      
      {isProductDetailEmpty && <NoDataFound message="No product details found." />}
      
      {flattenProductDetails && (
        <>
          <ProductDetailInformationSection product={flattenProductDetails} />
          <ProductDetailStatusSection product={flattenProductDetails} />
          <ProductDetailAuditSection product={flattenProductDetails} />
        </>
      )}
    </Box>
  );
};

export default ProductDetailPage;
