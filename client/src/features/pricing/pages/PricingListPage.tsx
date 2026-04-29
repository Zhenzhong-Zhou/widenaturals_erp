import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import {
  CustomTypography,
  ErrorMessage,
  Loading,
  NoDataFound,
  CustomButton,
} from '@components/index';
import {
  PricingExportControls,
  PricingFiltersPanel,
  PricingListTable,
  PricingSortControls,
} from '@features/pricing/components/PricingListTable';
import { usePaginatedPricing } from '@hooks/index';
import { usePaginationHandlers } from '@utils/hooks';
import {
  PricingFilters,
  PricingSortField,
} from '@features/pricing';
import { applyFiltersAndSorting } from '@utils/query';
import { usePricingLookups } from '@features/pricing/hooks';

const PricingListPage = () => {
  // -------------------------------------------------------------
  // Local state
  // -------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<PricingSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<PricingFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // -------------------------------------------------------------
  // Export state
  // -------------------------------------------------------------
  const [liveFilters, setLiveFilters] = useState<PricingFilters>({});
  
  // -------------------------------------------------------------
  // Pricing list fetch
  // -------------------------------------------------------------
  const {
    data: pricing,
    pagination: pricingPagination,
    loading: isPricingLoading,
    error: pricingError,
    totalRecords: pricingTotalRecords,
    isEmpty: isPricingListEmpty,
    fetchPricing: fetchPaginatedPricingList,
    resetPricing: resetPricingList,
  } = usePaginatedPricing();
  
  const lookups = usePricingLookups();
  
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
    [page, limit, sortBy, sortOrder, filters],
  );
  
  // -------------------------------------------------------------
  // Refresh list
  // -------------------------------------------------------------
  const refreshPricingList = useCallback(() => {
    fetchPaginatedPricingList(fullQuery);
  }, [fullQuery, fetchPaginatedPricingList]);
  
  // -------------------------------------------------------------
  // Debounced query execution payload
  // -------------------------------------------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshPricingList,
    }),
    [fullQuery, refreshPricingList],
  );
  
  // -------------------------------------------------------------
  // Debounced list fetch
  // -------------------------------------------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);
  
  // Reset on unmount
  useEffect(() => {
    return () => {
      resetPricingList();
    };
  }, [resetPricingList]);
  
  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleResetFilters = useCallback(() => {
    resetPricingList();
    setFilters({});
    setPage(1);
  }, [resetPricingList]);
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit,
  );
  
  const handleDrillDownToggle = useCallback((rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  }, []);
  
  const lookupHandlers = {
    onOpen: {
      product: () => {
        if (!lookups.product.options.length) {
          lookups.product.fetch();
        }
      },
      sku: () => {
        if (!lookups.sku.options.length) {
          lookups.sku.fetch();
        }
      },
    },
  };
  
  const handleFilterChange = useCallback((live: PricingFilters) => {
    setLiveFilters(live);
  }, []);
  
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
          Pricing
        </CustomTypography>
        
        {/* ---- Export Controls ---- */}
        <PricingExportControls liveFilters={liveFilters} />
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* ---------------------------------------- */}
      {/* Filter + Sort Controls */}
      {/* ---------------------------------------- */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <PricingFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onFilterChange={handleFilterChange}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PricingSortControls
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
      {isPricingLoading && isPricingListEmpty ? (
        <Loading variant="dotted" message="Loading Pricing..." />
      ) : pricingError ? (
        <ErrorMessage message={pricingError} showNavigation />
      ) : isPricingListEmpty || !pricingPagination ? (
        <NoDataFound
          message="No pricing records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <PricingListTable
          data={pricing}
          loading={isPricingLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pricingTotalRecords}
          totalPages={pricingPagination.totalPages}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={refreshPricingList}
        />
      )}
    </Box>
  );
};

export default PricingListPage;
