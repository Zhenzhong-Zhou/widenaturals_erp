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
import { usePaginatedPricingTypes } from '@hooks/index';
import {
  PricingTypeListTable,
  PricingTypeFiltersPanel,
  PricingTypeSortControls,
} from '@features/pricingType/components/PricingTypeListTable';
import type {
  PricingTypeFilters,
  PricingTypeSortField,
} from '@features/pricingType';
import { applyFiltersAndSorting } from '@utils/query';
import { usePaginationHandlers } from '@utils/hooks';
import { usePricingTypeLookups } from '@features/pricingType/hooks';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';

/**
 * Page-level container for displaying a paginated, sortable, and filterable
 * list of pricing type records.
 *
 * Responsibilities:
 * - Orchestrates pagination, sorting, and filtering state
 * - Triggers pricing type data fetching
 * - Coordinates UI controls and table rendering
 * - Renders table, empty, loading, and error states
 *
 * Data shaping and normalization are handled upstream
 * (Redux slice / transformers), not within this component.
 */
const PricingTypeListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<PricingTypeSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<PricingTypeFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    data: pricingTypeData,
    pagination: pricingTypePagination,
    loading: pricingTypeLoading,
    error: pricingTypeError,
    isEmpty: isPricingTypeEmpty,
    fetchPricingTypes,
    resetPricingTypes,
  } = usePaginatedPricingTypes();
  
  const lookups = usePricingTypeLookups();
  
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
  const refreshPricingTypeList = useCallback(() => {
    fetchPricingTypes(fullQuery);
  }, [fullQuery, fetchPricingTypes]);
  
  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshPricingTypeList,
    }),
    [fullQuery, refreshPricingTypeList]
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
      resetPricingTypes();
    };
  }, [resetPricingTypes]);
  
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
    resetPricingTypes();
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
          Pricing Type Management
        </CustomTypography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <PricingTypeFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PricingTypeSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Pricing Type Table Section */}
      {pricingTypeLoading || !pricingTypePagination ? (
        <Loading variant="dotted" message="Loading pricing types..." />
      ) : pricingTypeError ? (
        <ErrorMessage message={pricingTypeError} showNavigation />
      ) : isPricingTypeEmpty ? (
        <NoDataFound
          message="No pricing type records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <PricingTypeListTable
          data={pricingTypeData}
          loading={pricingTypeLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pricingTypePagination.totalRecords}
          totalPages={pricingTypePagination.totalPages}
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

export default PricingTypeListPage;
