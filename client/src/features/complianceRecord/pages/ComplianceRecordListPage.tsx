import { useState, lazy, useMemo, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';
import NoDataFound from '@components/common/NoDataFound';
import {
  ComplianceFilters,
  ComplianceRecordSortField,
} from '@features/complianceRecord/state';
import usePaginatedComplianceRecords from '@hooks/usePaginatedComplianceRecords';
import useComplianceRecordLookups from '@features/complianceRecord/hooks/useComplianceRecordLookups';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks';
import { flattenComplianceRecordsToRows } from '@features/complianceRecord/utils/flattenComlianceListData';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';
import {
  ComplianceFiltersPanel,
  ComplianceSortControls,
} from '@features/complianceRecord/components/ComplianceRecordListTable';

const ComplianceListTable = lazy(
  () =>
    import('@features/complianceRecord/components/ComplianceRecordListTable/ComplianceRecordListTable')
);

const ComplianceRecordListPage = () => {
  // -----------------------------
  // Local UI state
  // -----------------------------
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<ComplianceRecordSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<ComplianceFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // -----------------------------
  // Data sources
  // -----------------------------
  const {
    data: complianceRecords,
    loading: isComplianceLoading,
    error: complianceError,
    totalRecords: complianceTotal,
    isEmpty: isComplianceEmpty,
    pageInfo: compliancePageInfo,
    fetchComplianceRecords,
    resetComplianceRecords,
  } = usePaginatedComplianceRecords();

  const lookups = useComplianceRecordLookups();

  // -----------------------------
  // Derived data
  // -----------------------------
  const flattenListData = flattenComplianceRecordsToRows(complianceRecords);

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
  const refreshComplianceList = useCallback(() => {
    fetchComplianceRecords(fullQuery);
  }, [fullQuery, fetchComplianceRecords]);

  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshComplianceList,
    }),
    [fullQuery, refreshComplianceList]
  );

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
      resetComplianceRecords();
    };
  }, [resetComplianceRecords]);

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
  const handleResetFilters = useCallback(() => {
    resetComplianceRecords();
    setFilters({});
    lookupHandlers.resetAll();
    setPage(1);
  }, [resetComplianceRecords, lookupHandlers]);

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

  // Show empty state only when data is truly empty (avoid flashing during loading)
  const showEmpty =
    isComplianceEmpty || (!isComplianceLoading && flattenListData.length === 0);

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
          Compliance Records Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <ComplianceFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <ComplianceSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {isComplianceLoading ? (
        <Loading variant="dotted" message="Loading Compliance Records..." />
      ) : complianceError ? (
        <ErrorMessage message={complianceError} showNavigation={true} />
      ) : showEmpty ? (
        <NoDataFound
          message="No Compliance Records found."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <ComplianceListTable
          data={flattenListData}
          loading={isComplianceLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={complianceTotal}
          totalPages={compliancePageInfo?.totalPages ?? 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={refreshComplianceList}
        />
      )}
    </Box>
  );
};

export default ComplianceRecordListPage;
