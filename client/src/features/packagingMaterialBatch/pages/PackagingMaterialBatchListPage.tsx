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
import { usePaginatedPackagingMaterialBatches } from '@hooks/index';
import {
  PackagingMaterialBatchListTable,
  PackagingMaterialBatchFiltersPanel,
  PackagingMaterialBatchSortControls,
} from '@features/packagingMaterialBatch/components/PackagingMaterialBatchListTable';
import type {
  PackagingMaterialBatchFilters,
  PackagingMaterialBatchSortKey,
} from '@features/packagingMaterialBatch/state';
import { applyFiltersAndSorting } from '@utils/query';
import { usePaginationHandlers } from '@utils/hooks';
import { usePackagingMaterialBatchLookups } from '@features/packagingMaterialBatch/hooks';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';

/**
 * Page-level container for displaying a paginated, sortable,
 * and filterable list of packaging material batch records.
 *
 * Responsibilities:
 * - Orchestrates pagination, sorting, and filtering state
 * - Triggers packaging material batch data fetching
 * - Coordinates UI controls and table rendering
 * - Renders loading, empty, and error states
 *
 * Data normalization is handled upstream (Redux slice / transformers).
 */
const PackagingMaterialBatchListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<PackagingMaterialBatchSortKey>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] =
    useState<PackagingMaterialBatchFilters>({});
  const [expandedRowId, setExpandedRowId] =
    useState<string | null>(null);
  
  const {
    data,
    pagination,
    loading,
    error,
    isEmpty,
    fetchPackagingMaterialBatches,
    resetPackagingMaterialBatches,
  } = usePaginatedPackagingMaterialBatches();
  
  const lookups = usePackagingMaterialBatchLookups();
  
  // -----------------------------
  // Query model
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
  const refreshList = useCallback(() => {
    fetchPackagingMaterialBatches(fullQuery);
  }, [fullQuery, fetchPackagingMaterialBatches]);
  
  // -----------------------------
  // Query params engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshList,
    }),
    [fullQuery, refreshList]
  );
  
  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const timeout = setTimeout(
      () => applyFiltersAndSorting(queryParams),
      200
    );
    return () => clearTimeout(timeout);
  }, [queryParams]);
  
  // ----------------------------------------
  // Cleanup on unmount
  // ----------------------------------------
  useEffect(() => {
    return () => {
      resetPackagingMaterialBatches();
    };
  }, [resetPackagingMaterialBatches]);
  
  // -----------------------------
  // Lookup handlers
  // -----------------------------
  const lookupHandlers = useMemo(
    () => ({
      resetAll: () => {
        lookups.status.reset();
        lookups.supplier.reset?.();
        lookups.packagingMaterial.reset?.();
      },
      
      onOpen: {
        status: createLazyOpenHandler(
          lookups.status.options,
          lookups.status.fetch
        ),
        supplier: createLazyOpenHandler(
          lookups.supplier.options,
          lookups.supplier.fetch
        ),
        packagingMaterial: createLazyOpenHandler(
          lookups.packagingMaterial.options,
          lookups.packagingMaterial.fetch
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
    resetPackagingMaterialBatches();
    setFilters({});
    lookupHandlers.resetAll();
    setPage(1);
  };
  
  const { handlePageChange, handleRowsPerPageChange } =
    usePaginationHandlers(setPage, setLimit);
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) =>
      current === rowId ? null : rowId
    );
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
          Packaging Material Batch Management
        </CustomTypography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filters + Sort */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <PackagingMaterialBatchFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PackagingMaterialBatchSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Table Section */}
      {loading || !pagination ? (
        <Loading
          variant="dotted"
          message="Loading packaging material batches..."
        />
      ) : error ? (
        <ErrorMessage message={error} showNavigation />
      ) : isEmpty ? (
        <NoDataFound
          message="No packaging material batch records found."
          action={
            <CustomButton onClick={handleResetFilters}>
              Reset
            </CustomButton>
          }
        />
      ) : (
        <PackagingMaterialBatchListTable
          data={data}
          loading={loading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
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

export default PackagingMaterialBatchListPage;
