import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  LocationFiltersPanel,
  LocationListTable,
  LocationSortControls,
} from '@features/location/components/LocationListTable';
import type {
  LocationListFilters,
  LocationSortField,
} from '@features/location';
import { usePaginatedLocations, useUserLookup } from '@hooks/index';
import { useLocationLookups } from '@features/location/hooks';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';
import { usePaginationHandlers } from '@utils/hooks';

const LocationListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<LocationSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<LocationListFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const {
    data: locations,
    pagination: locationPagination,
    loading: isLocationLoading,
    error: locationError,
    isEmpty: isLocationEmpty,
    fetchLocations,
    resetLocations,
  } = usePaginatedLocations();

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

  const lookups = useLocationLookups();

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
  const refreshLocationList = useCallback(() => {
    fetchLocations(fullQuery);
  }, [fullQuery, fetchLocations]);

  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshLocationList,
    }),
    [fullQuery, refreshLocationList]
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
      resetLocations();
    };
  }, [resetLocations]);

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
    resetLocations();
    setFilters({});
    lookupHandlers.resetAll();
    resetUserLookup();
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
          Location Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <LocationFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
              // Shared user lookup
              userOptions={userOptions}
              userLoading={isUserLookupLoading}
              userError={userLookupError}
              userMeta={userLookupMeta}
              fetchUserLookup={fetchUserLookup}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LocationSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Product Batch Table Section */}
      {isLocationLoading || !locationPagination ? (
        <Loading variant="dotted" message="Loading product batches..." />
      ) : locationError ? (
        <ErrorMessage message={locationError} showNavigation />
      ) : isLocationEmpty ? (
        <NoDataFound
          message="No location records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <LocationListTable
          data={locations}
          loading={isLocationLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={locationPagination.totalRecords}
          totalPages={locationPagination.totalPages}
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

export default LocationListPage;
