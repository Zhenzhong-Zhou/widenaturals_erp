import { useEffect, useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  Loading,
  NoDataFound,
} from '@components/index';
import { usePaginatedProductBatches } from '@hooks/index';
import {
  ProductBatchListTable,
  ProductBatchFiltersPanel,
  ProductBatchSortControls,
} from '@features/productBatch/components/ProductBatchListTable';
import type {
  ProductBatchFilters,
  ProductBatchSortField,
} from '@features/productBatch/state';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks';
import { useProductBatchLookups } from '@features/productBatch/hooks';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';

/**
 * Page-level container for displaying a paginated, sortable, and filterable
 * list of product batch records.
 *
 * Responsibilities:
 * - Orchestrates pagination, sorting, and filtering state
 * - Triggers product batch data fetching
 * - Coordinates UI controls and table rendering
 * - Renders table, empty, loading, and error states
 *
 * Data shaping and normalization are handled upstream
 * (Redux slice / transformers), not within this component.
 */
const ProductBatchListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<ProductBatchSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<ProductBatchFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const {
    data: productBatchData,
    pagination: productBatchPagination,
    loading: productBatchLoading,
    error: productBatchError,
    isEmpty: isProductBatchEmpty,
    fetchProductBatches,
    resetProductBatches,
  } = usePaginatedProductBatches();

  const lookups = useProductBatchLookups();

  // -----------------------------
  // Query model (shared)
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
  const refreshProductBatchList = useCallback(() => {
    fetchProductBatches(fullQuery);
  }, [fullQuery, fetchProductBatches]);

  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshProductBatchList,
    }),
    [fullQuery, refreshProductBatchList]
  );

  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);

  // ----------------------------------------
  // Cleanup on unmount
  // ----------------------------------------
  useEffect(() => {
    return () => {
      resetProductBatches();
    };
  }, [resetProductBatches]);

  // -----------------------------
  // Lookup handlers (lazy fetch, reset)
  // -----------------------------
  const lookupHandlers = useMemo(
    () => ({
      resetAll: () => {
        lookups.status.reset();
      },

      onOpen: {
        status: createLazyOpenHandler(
          lookups.status.options,
          lookups.status.fetch
        ),
      },
    }),
    [lookups]
  );

  // -----------------------------
  // Event handlers
  // -----------------------------
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);

  const handleResetFilters = () => {
    resetProductBatches();
    setFilters({});
    lookupHandlers.resetAll();
    setPage(1);
  };

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          Product Batch Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <ProductBatchFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductBatchSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Product Batch Table Section */}
      {productBatchLoading || !productBatchPagination ? (
        <Loading variant="dotted" message="Loading product batches..." />
      ) : productBatchError ? (
        <ErrorMessage message={productBatchError} showNavigation />
      ) : isProductBatchEmpty ? (
        <NoDataFound
          message="No product batch records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <ProductBatchListTable
          data={productBatchData}
          loading={productBatchLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={productBatchPagination.totalRecords}
          totalPages={productBatchPagination.totalPages}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  );
};

export default ProductBatchListPage;
