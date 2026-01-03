import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import { ProductsCreateDialog } from '@features/product/components/CreateProductForm';
import ProductListTable, {
  ProductFiltersPanel,
  ProductSortControls,
} from '@features/product/components/ProductListTable';
import {
  usePaginatedProducts,
  useStatusLookup,
  useUserLookup,
} from '@hooks/index';
import { useDialogFocusHandlers } from '@utils/hooks/useDialogFocusHandlers';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import type {
  ProductListFilters,
  ProductSortField,
} from '@features/product/state';
import type { UserLookupParams } from '@features/lookup';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { flattenProductRecords } from '@features/product/utils/flattenProductListData';
import { createDropdownBundle } from '@utils/lookupHelpers';

const ProductListPage = () => {
  // -------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<ProductSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<ProductListFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createButtonRef = useRef<HTMLButtonElement>(null);

  // -------------------------------------------------------------
  // Product list fetch
  // -------------------------------------------------------------
  const {
    data: products,
    pagination: productPagination,
    loading: isProductLoading,
    error: productError,
    totalRecords: productTotalRecords,
    isEmpty: isProductListEmpty,
    fetchProducts: fetchPaginatedProductsList,
    resetProducts: resetProductList,
  } = usePaginatedProducts();

  // -------------------------------------------------------------
  // Status lookup
  // -------------------------------------------------------------
  const {
    options: statusOptions,
    loading: isStatusLoading,
    error: statusError,
    fetch: fetchStatusOptions,
    reset: resetStatusOptions,
  } = useStatusLookup();
  
  // -------------------------------------------------------------
  // User lookup
  // -------------------------------------------------------------
  const {
    options: userOptions,
    loading: isUserLookupLoading,
    error: userLookupError,
    meta: userLookupMeta,
    fetch: fetchUserLookup,
    reset: resetUserLookup,
  } = useUserLookup();

  // -------------------------------------------------------------
  // User dropdown query state
  // -------------------------------------------------------------
  const createdByDropdown = createDropdownBundle<UserLookupParams>({});
  const updatedByDropdown = createDropdownBundle<UserLookupParams>({});
  
  const {
    fetchParams: createdByFetchParams,
    setFetchParams: setCreatedByFetchParams,
  } = createdByDropdown;
  
  const {
    fetchParams: updatedByFetchParams,
    setFetchParams: setUpdatedByFetchParams,
  } = updatedByDropdown;
  
  // -------------------------------------------------------------
  // Derived flattened rows
  // -------------------------------------------------------------
  const flattenProductListData = useMemo(
    () => flattenProductRecords(products),
    [products]
  );

  // -------------------------------------------------------------
  // Combined query object
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Refresh list
  // -------------------------------------------------------------
  const refreshProductList = useCallback(() => {
    fetchPaginatedProductsList(fullQuery);
  }, [fullQuery, fetchPaginatedProductsList]);

  // -------------------------------------------------------------
  // Debounced query execution payload
  // (used by applyFiltersAndSorting)
  // -------------------------------------------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshProductList,
    }),
    [fullQuery, refreshProductList]
  );

  // -------------------------------------------------------------
  // Debounced list fetch
  // -------------------------------------------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);

  // Reset filters on unmount
  useEffect(() => {
    return () => {
      resetProductList();
    };
  }, [resetProductList]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleResetFilters = useCallback(() => {
    resetProductList();
    setFilters({});
    resetStatusOptions();
    resetUserLookup();
    setPage(1);
  }, [resetProductList, resetStatusOptions, resetUserLookup]);
  
  const handleStatusDropdownOpen = useCallback(() => {
    if (!statusOptions.length) {
      fetchStatusOptions();
    }
  }, [statusOptions.length, fetchStatusOptions]);
  
  const handleCreatedByOpen = useCallback(() => {
    if (!userOptions.length) {
      fetchUserLookup(createdByFetchParams);
    }
  }, [userOptions.length, fetchUserLookup, createdByFetchParams]);
  
  const handleUpdatedByOpen = useCallback(() => {
    if (!userOptions.length) {
      fetchUserLookup(updatedByFetchParams);
    }
  }, [userOptions.length, fetchUserLookup, updatedByFetchParams]);

  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setDialogOpen,
    createButtonRef,
    () => dialogOpen
  );

  const handleDrillDownToggle = useCallback((rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  }, []);

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* ---------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          Product Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ---------------------------------------- */}
      {/* Modal Dialog */}
      {/* ---------------------------------------- */}
      <ProductsCreateDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={refreshProductList}
      />

      {/* ---------------------------------------- */}
      {/* Filter + Sort Controls */}
      {/* ---------------------------------------- */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <ProductFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
              
              // Status lookup
              onStatusOpen={handleStatusDropdownOpen}
              statusOptions={statusOptions}
              statusLoading={isStatusLoading}
              statusError={statusError}
              
              // Shared user lookup
              userOptions={userOptions}
              userLoading={isUserLookupLoading}
              userError={userLookupError}
              userMeta={userLookupMeta}
              fetchUserLookup={fetchUserLookup}
              
              // Created By
              onCreatedByOpen={handleCreatedByOpen}
              createdByFetchParams={createdByFetchParams}
              setCreatedByFetchParams={setCreatedByFetchParams}
              
              // Updated By
              onUpdatedByOpen={handleUpdatedByOpen}
              updatedByFetchParams={updatedByFetchParams}
              setUpdatedByFetchParams={setUpdatedByFetchParams}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* ---------------------------------------- */}
      {/* Main Table Rendering */}
      {/* ---------------------------------------- */}
      {isProductLoading && isProductListEmpty ? (
        <Loading variant="dotted" message="Loading Products..." />
      ) : productError ? (
        <ErrorMessage message={productError} showNavigation />
      ) : isProductListEmpty ? (
        <NoDataFound
          message="No Products found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <ProductListTable
          data={flattenProductListData}
          loading={isProductLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={productTotalRecords || 0}
          totalPages={productPagination.totalPages || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={refreshProductList}
          onAddNew={handleOpenDialog}
        />
      )}
    </Box>
  );
};

export default ProductListPage;
