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
  NoDataFound
} from '@components/index';
import { usePaginatedBatchRegistry } from '@hooks/index';
import { useBatchRegistryLookups } from '@features/batchRegistry/hook';
import BatchRegistryListTable, {
  BatchRegistryFiltersPanel,
  BatchRegistrySortControls,
} from '@features/batchRegistry/components/BatchRegistry';
import type {
  BatchRegistryFilters,
  BatchRegistrySortField,
} from '@features/batchRegistry/state';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';

/**
 * Page-level container for displaying a paginated, sortable, and filterable
 * list of batch registry records.
 *
 * Responsibilities:
 * - Orchestrates pagination, sorting, and filtering state
 * - Triggers batch registry data fetching
 * - Coordinates lookup data and UI controls
 * - Renders table, empty, loading, and error states
 *
 * Data shaping and normalization are handled upstream
 * (Redux slice / transformers), not within this component.
 */
const BatchRegistryListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<BatchRegistrySortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<BatchRegistryFilters>({});
  const [expandedRowId, setExpandedRowId] =
    useState<string | null>(null);
  
  const {
    data: batchRegistryData,
    pagination: batchRegistryPagination,
    loading: batchRegistryLoading,
    error: batchRegistryError,
    isEmpty: isBatchRegistryEmpty,
    fetchBatchRegistry,
    resetBatchRegistry,
  } = usePaginatedBatchRegistry();
  
  const lookups = useBatchRegistryLookups();
  
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
  const refreshBatchRegistryList = useCallback(() => {
    fetchBatchRegistry(fullQuery);
  }, [fullQuery, fetchBatchRegistry]);
  
  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshBatchRegistryList,
    }),
    [fullQuery, refreshBatchRegistryList]
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
      resetBatchRegistry();
    };
  }, [resetBatchRegistry]);
  
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
    resetBatchRegistry();
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
          Batch Registry
        </CustomTypography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <BatchRegistryFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <BatchRegistrySortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Batch Registry Table Section */}
      {batchRegistryLoading || !batchRegistryPagination ? (
        <Loading
          variant="dotted"
          message="Loading batch registry..."
        />
      ) : batchRegistryError ? (
        <ErrorMessage message={batchRegistryError} showNavigation />
      ) : isBatchRegistryEmpty ? (
        <NoDataFound
          message="No batch registry records found."
          action={
            <CustomButton onClick={handleResetFilters}>
              Reset
            </CustomButton>
          }
        />
      ) : (
        <BatchRegistryListTable
          data={batchRegistryData}
          loading={batchRegistryLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={batchRegistryPagination.totalRecords}
          totalPages={batchRegistryPagination.totalPages}
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

export default BatchRegistryListPage;
