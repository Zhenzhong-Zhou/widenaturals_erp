import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import CustomButton from '@components/common/CustomButton';
import ProductCard from '@features/product/components/ProductCard';
import CustomPagination from '@components/common/CustomPagination';
import useSkuProductCards from '@hooks/useSkuProductCards';
import GoBackButton from '@components/common/GoBackButton.tsx';
import type {
  SkuProductCard,
  SkuProductCardFilters,
} from '@features/product/state';
import SkuProductCardFilterPanel from '../components/SkuProductCardFilterPanel';

const ProductsPage = () => {
  const [filters, setFilters] = useState<SkuProductCardFilters>({});
  const {
    skuCardList,
    skuCardPagination,
    isSkuCardLoading,
    skuCardError,
    refreshSkuCards,
  } = useSkuProductCards(filters);

  const { page, totalPages, totalRecords, limit } = skuCardPagination;

  // Auto fetch on mount
  useEffect(() => {
    refreshSkuCards(1, limit, filters);
  }, [refreshSkuCards, limit]); // run once on mount

  const handleFilterChange = (newFilters: SkuProductCardFilters) => {
    setFilters(newFilters);
    refreshSkuCards(1, limit, newFilters); // reset to first page
  };

  const handlePageChange = (newPage: number) => {
    refreshSkuCards(newPage, limit, filters); // reuse current filters
  };

  if (isSkuCardLoading) return <Loading message="Loading products..." />;

  if (skuCardError) return <ErrorMessage message={skuCardError} />;

  if (!skuCardList) return <NoDataFound message="No product data found." />;

  return (
    <Container>
      <Stack direction="column" spacing={2} mt={3}>
        {/* Top Action Buttons */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <CustomButton onClick={() => refreshSkuCards(page, limit, filters)}>
            Refresh Product Cards
          </CustomButton>
          <GoBackButton />
        </Stack>

        {/* Filters */}
        <SkuProductCardFilterPanel
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* Cards Grid */}
        <Box>
          <Grid
            container
            spacing={{ xs: 2, md: 3, lg: 4 }}
            columns={{ xs: 2, sm: 8, md: 12 }}
          >
            {skuCardList.map((skuCard: SkuProductCard, index: number) => (
              <Grid key={skuCard.skuId || index} size={{ xs: 2, sm: 4, md: 4 }}>
                <ProductCard isLoading={isSkuCardLoading} product={skuCard} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pagination */}
        <Box mt={4} display="flex" justifyContent="center">
          <CustomPagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default ProductsPage;
