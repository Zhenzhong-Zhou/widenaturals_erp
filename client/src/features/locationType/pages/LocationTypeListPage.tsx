import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  LocationTypeFiltersPanel,
  LocationTypeListTable,
  LocationTypeSortControls,
} from '@features/locationType/components/LocationTypeListTable';
import { ViewLocationTypeDialog } from '@features/locationType/components/LocationTypeDetail';
import type {
  LocationTypeListFilters,
  LocationTypeSortField,
} from '@features/locationType';
import { usePaginatedLocationTypes } from '@hooks/index';
import { useLocationTypeLookups } from '@features/locationType/hooks';
import { applyFiltersAndSorting } from '@utils/query';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';
import { useDialogFocusHandlers, usePaginationHandlers } from '@utils/hooks';

const LocationTypeListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<LocationTypeSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<LocationTypeListFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedLocationTypeId, setSelectedLocationTypeId] = useState<
    string | null
  >(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const viewActionButtonRef = useRef<HTMLButtonElement | null>(null);

  const {
    data: locationTypes,
    pagination: locationTypePagination,
    loading: isLocationTypeLoading,
    error: locationTypeError,
    isEmpty: isLocationTypeEmpty,
    fetchLocationTypes,
    resetLocationTypes,
  } = usePaginatedLocationTypes();

  // -------------------------------------------------------------
  // Lookups
  // -------------------------------------------------------------
  const lookups = useLocationTypeLookups();

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
  const refreshLocationTypeList = useCallback(() => {
    fetchLocationTypes(fullQuery);
  }, [fullQuery, fetchLocationTypes]);

  // -----------------------------
  // Query engine params
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshLocationTypeList,
    }),
    [fullQuery, refreshLocationTypeList]
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
      resetLocationTypes();
    };
  }, [resetLocationTypes]);

  // -----------------------------
  // Lookup handlers
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
    resetLocationTypes();
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

  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setViewDialogOpen,
    viewActionButtonRef,
    () => viewDialogOpen
  );

  const handleViewDetail = useCallback(
    (rowId: string) => {
      setSelectedLocationTypeId(rowId);
      handleOpenDialog();
    },
    [handleOpenDialog]
  );

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
          Location Type Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <LocationTypeFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LocationTypeSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Table Section */}
      {isLocationTypeLoading || !locationTypePagination ? (
        <Loading variant="dotted" message="Loading location types..." />
      ) : locationTypeError ? (
        <ErrorMessage message={locationTypeError} showNavigation />
      ) : isLocationTypeEmpty ? (
        <NoDataFound
          message="No location type records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <LocationTypeListTable
          data={locationTypes}
          loading={isLocationTypeLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={locationTypePagination.totalRecords}
          totalPages={locationTypePagination.totalPages}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onViewDetail={handleViewDetail}
          onRefresh={handleRefresh}
        />
      )}

      <ViewLocationTypeDialog
        open={viewDialogOpen}
        locationTypeId={selectedLocationTypeId}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};

export default LocationTypeListPage;
