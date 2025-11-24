import { useEffect, useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import usePaginatedSkus from '@hooks/usePaginatedSkus';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import
  SkuListTable, {
  SkuFiltersPanel,
  SkuSortControls
} from '@features/sku/components/SkuListTable';
import type { SkuListFilters, SkuSortField } from '@features/sku/state/skuTypes';
import { flattenSkuRecords } from '@features/sku/utils/flattenSkuData';

/**
 * Page component displaying a paginated, filterable, and sortable list of SKUs.
 *
 * Uses the `usePaginatedSkus` hook to manage:
 *   - Fetching paginated SKU records
 *   - Handling pagination, filters, and sorting
 *   - Integrating loading, error, and empty states
 *
 * @example
 * <SkuListPage />
 */
const SkuListPage = () => {
  // Local UI State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<SkuSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] =
    useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<SkuListFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // SKU list hook
  const {
    data: skuData,
    pagination: skuPagination,
    loading: skuLoading,
    error: skuError,
    isEmpty: isSkuListEmpty,
    fetchSkus: fetchPaginatedSkusList,
    resetSkus: resetSkuState,
  } = usePaginatedSkus();
  
  const flattenData = flattenSkuRecords(skuData);
  
  // -----------------------------
  // Shared query object
  // -----------------------------
  const fullQuery = useMemo(() => ({
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
  }), [page, limit, sortBy, sortOrder, filters]);
  
  // -----------------------------
  // Refresh action
  // -----------------------------
  const refreshSkuList = useCallback(() => {
    fetchPaginatedSkusList(fullQuery);
  }, [fullQuery, fetchPaginatedSkusList]);
  
  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(() => ({
    ...fullQuery,
    fetchFn: refreshSkuList,
  }), [fullQuery, refreshSkuList]);
  
  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);
  
  // Reset filters on unmount
  useEffect(() => {
    return () => {
      resetSkuState();
    };
  }, [resetSkuState]);
  
  const handleResetFilters = () => {
    resetSkuState();
    setFilters({});
    setPage(1);
  };
  
  const { handlePageChange, handleRowsPerPageChange } =
    usePaginationHandlers(setPage, setLimit);
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          SKU Management
        </CustomTypography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <SkuFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SkuSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Main Table Rendering */}
      {skuLoading ? (
        <Loading variant="dotted" message="Loading SKUs..." />
      ) : skuError ? (
        <ErrorMessage message={skuError} showNavigation={true} />
      ) : (isSkuListEmpty ?? flattenData.length === 0) ? (
        <NoDataFound
          message="No SKUs found."
          action={<CustomButton onClick={handleResetFilters}>Reset</CustomButton>}
        />
      ) : (
        <SkuListTable
          data={flattenData}
          loading={skuLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={skuPagination.totalRecords || 0}
          totalPages={skuPagination.totalPages || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={refreshSkuList}
        />
      )}
    </Box>
  );
};

export default SkuListPage;
