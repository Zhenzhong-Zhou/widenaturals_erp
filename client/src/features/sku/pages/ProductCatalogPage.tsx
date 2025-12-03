import { useCallback, useEffect, useMemo, useState } from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import CustomButton from '@components/common/CustomButton';
import CustomPagination from '@components/common/CustomPagination';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import GoBackButton from '@components/common/GoBackButton';
import BaseInput from '@components/common/BaseInput';
import useSkuProductCards from '@hooks/useSkuProductCards';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import type {
  SkuProductCardFilters,
  SkuProductCardSortField,
  SkuProductCardViewItem,
} from '@features/sku/state';
import {
  ProductCatalogCard,
  ProductCatalogCardFilterPanel,
  ProductCatalogCardSortControls,
} from '@features/sku/components/ProductCatalog';

const ProductCatalogPage = () => {
  // -----------------------------
  // Local UI state
  // -----------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<SkuProductCardSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<SkuProductCardFilters>({});

  // -----------------------------
  // Data fetching (Redux)
  // -----------------------------
  const {
    items: productCards,
    pagination: catalogPagination,
    loading: isCatalogLoading,
    error: catalogError,
    isEmpty: isCatalogEmpty,
    fetchCards: fetchProductCatalog,
    reset: resetProductCatalog,
  } = useSkuProductCards();

  // -----------------------------
  // Shared query object
  // -----------------------------
  const fullQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    }),
    [page, limit, sortBy, sortOrder, filters]
  );

  // -----------------------------
  // Refresh action
  // -----------------------------
  const refreshCatalog = useCallback(() => {
    fetchProductCatalog(fullQuery);
  }, [fullQuery, fetchProductCatalog]);

  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshCatalog,
    }),
    [fullQuery, refreshCatalog]
  );

  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);

  // -----------------------------
  // Cleanup on unmount
  // -----------------------------
  useEffect(() => {
    return () => resetProductCatalog();
  }, [resetProductCatalog]);

  // -----------------------------
  // Event handlers
  // -----------------------------
  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleFilterChange = (newFilters: SkuProductCardFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <Container maxWidth={false} sx={{ px: 2 }}>
      <Stack direction="column" spacing={3} mt={3}>
        {/* Page Title */}
        <CustomTypography
          variant="h4"
          fontWeight={700}
          sx={{ textAlign: 'center', mb: 1 }}
        >
          Product Catalog
        </CustomTypography>

        {/* Action Bar */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="flex-end"
          flexWrap="wrap"
          sx={{ mb: 1, mt: 3 }}
        >
          <CustomButton
            size="medium"
            variant="contained"
            color="primary"
            sx={{ minWidth: 160, height: 44, borderRadius: 22, px: 3 }}
            onClick={refreshCatalog}
          >
            Refresh
          </CustomButton>

          <GoBackButton
            size="medium"
            sx={{ minWidth: 160, height: 44, borderRadius: 22, px: 3 }}
          />
        </Stack>

        {/* Filter & Sort Panel */}
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 3, border: '1px solid #eee' }}
        >
          <ProductCatalogCardFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onApply={() => setPage(1)}
            onReset={handleResetFilters}
          />

          <ProductCatalogCardSortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
        </Paper>

        {/* Items Per Page */}
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <BaseInput
            name="limit"
            label="Items per page"
            select
            size="small"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            sx={{ width: 150 }}
          >
            {[10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </BaseInput>
        </Box>

        {/* Product Cards */}
        <Box>
          <Grid container spacing={{ xs: 2, md: 3, lg: 4 }}>
            {isCatalogLoading ? (
              <Loading variant="dotted" message="Loading product catalog..." />
            ) : catalogError ? (
              <ErrorMessage message={catalogError} showNavigation />
            ) : isCatalogEmpty || productCards.length === 0 ? (
              <NoDataFound
                message="No products found."
                action={
                  <CustomButton onClick={handleResetFilters}>
                    Reset
                  </CustomButton>
                }
              />
            ) : (
              productCards.map((skuCard: SkuProductCardViewItem) => (
                <Grid
                  key={skuCard.skuId}
                  size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                >
                  <ProductCatalogCard
                    isLoading={isCatalogLoading}
                    product={skuCard}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </Box>

        {/* Pagination */}
        <Box mt={4} display="flex" justifyContent="center">
          <CustomPagination
            page={page}
            itemsPerPage={limit}
            totalRecords={catalogPagination.totalRecords || 0}
            totalPages={catalogPagination.totalPages || 0}
            onPageChange={handlePageChange}
          />
        </Box>
      </Stack>
    </Container>
  );
};

export default ProductCatalogPage;
