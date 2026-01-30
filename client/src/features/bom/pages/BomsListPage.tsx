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
import BomListTable, {
  BomFiltersPanel,
  BomSortControls,
} from '@features/bom/components/BomListTables';
import { usePaginatedBoms } from '@hooks/index';
import type { BomListFilters, BomSortField } from '@features/bom/state';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks';

/**
 * Page component displaying a paginated and filterable list of BOMs.
 *
 * Uses the `usePaginatedBoms` hook to handle:
 *  - Fetching paginated BOM data
 *  - Managing filters, pagination, and loading state
 *  - Handling empty and error UI states
 *
 * @example
 * <BomListPage />
 */
const BomListPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<BomSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<BomListFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const {
    data: bomData,
    pagination: bomPagination,
    loading: bomLoading,
    error: bomError,
    isEmpty: isBomListEmpty,
    fetchBoms: fetchPaginatedBomsList,
    resetFilters: resetBomFilters,
  } = usePaginatedBoms();

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: fetchPaginatedBomsList,
    }),
    [page, limit, sortBy, sortOrder, filters, fetchPaginatedBomsList]
  );

  // --- Fetch data when filters or pagination change ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFiltersAndSorting(queryParams);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeout);
  }, [queryParams]);

  useEffect(() => {
    return () => {
      resetBomFilters();
    };
  }, [resetBomFilters]);

  // Stable refresh handler
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);

  const handleResetFilters = () => {
    resetBomFilters();
    setFilters({});
    setPage(1);
  };

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

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
          Bill of Materials Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <BomFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <BomSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* BOM Table Section */}
      {bomLoading || !bomPagination ? (
        <Loading variant="dotted" message="Loading boms..." />
      ) : bomError ? (
        <ErrorMessage message={bomError} showNavigation />
      ) : isBomListEmpty ? (
        <NoDataFound
          message="No boms found."
          action={
            <CustomButton onClick={handleResetFilters}>
              Reset
            </CustomButton>
          }
        />
      ) : (
        <BomListTable
          data={bomData}
          loading={bomLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={bomPagination.totalRecords}
          totalPages={bomPagination.totalPages}
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

export default BomListPage;
