import {
  type FC,
  useCallback,
  useEffect,
  useState,
  Suspense,
  useMemo,
  lazy,
} from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import {
  CustomTypography,
  GoBackButton,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  OutboundFulfillmentFiltersPanel,
  OutboundFulfillmentSortControls,
} from '@features/outboundFulfillment/components/OutboundFulfillmentTable';
import { usePaginationHandlers } from '@utils/hooks';
import { usePaginatedOutboundFulfillments } from '@hooks/index';
import type {
  OutboundFulfillmentFilters,
  OutboundFulfillmentSortKey,
} from '@features/outboundFulfillment/state';
import type { SortOrder } from '@shared-types/api';
import { applyFiltersAndSorting } from '@utils/queryUtils';

const OutboundFulfillmentsTable = lazy(
  () =>
    import('@features/outboundFulfillment/components/OutboundFulfillmentTable/OutboundFulfillmentTable')
);

// baseline empty filters
const emptyOutboundFulfillmentFilters: OutboundFulfillmentFilters = {
  keyword: '',
  orderNumber: '',
  orderId: '',
  createdBy: '',
  updatedBy: '',
  createdAfter: '',
  createdBefore: '',
  shippedAfter: '',
  shippedBefore: '',
  statusIds: [],
  warehouseIds: [],
  deliveryMethodIds: [],
};

/**
 * Page to list outbound fulfillments with pagination, sorting, and filters.
 * Uses the custom hook `usePaginatedOutboundFulfillments` to manage state and actions.
 */
const OutboundFulfillmentsListPage: FC = () => {
  // Local state for pagination/sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<OutboundFulfillmentSortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('');
  const [filters, setFilters] = useState<OutboundFulfillmentFilters>(
    {} as OutboundFulfillmentFilters
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Hook state
  const {
    loading: outboundFulfillmentsLoading,
    error: outboundFulfillmentsError,
    data: outboundFulfillments,
    pagination: outboundFulfillmentsPagination,
    fetch: fetchOutboundFulfillments,
    reset: resetOutboundFulfillments,
  } = usePaginatedOutboundFulfillments();

  // Memoize the query parameters to avoid unnecessary re-renders or function calls
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: (params: Record<string, any>) => {
        fetchOutboundFulfillments(params); // no category needed here
      },
    }),
    [page, limit, sortBy, sortOrder, filters, fetchOutboundFulfillments]
  );

  // Fetch when dependencies change (with debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFiltersAndSorting(queryParams);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeout);
  }, [queryParams]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      resetOutboundFulfillments();
    };
  }, [resetOutboundFulfillments]);

  // Pagination handlers
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchOutboundFulfillments({ page, limit, sortBy, sortOrder });
  }, [fetchOutboundFulfillments, page, limit, sortBy, sortOrder]);

  // Expand toggle
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

  const handleResetOutboundFulfillmentFilters = () => {
    // clear redux slice state
    resetOutboundFulfillments();

    // reset local filter state
    setFilters(emptyOutboundFulfillmentFilters);

    // reset pagination
    setPage(1);
  };

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5">Outbound Fulfillments</CustomTypography>
        <GoBackButton sx={{ borderRadius: 20 }} />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          {/* Filter fields */}
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <OutboundFulfillmentFiltersPanel
              filters={filters}
              onChange={(newFilters) => setFilters(newFilters)}
              onApply={() => {
                setPage(1);
              }}
              onReset={handleResetOutboundFulfillmentFilters}
            />
          </Grid>

          {/* Sort Controls */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OutboundFulfillmentSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        {outboundFulfillmentsLoading && (
          <Loading variant="dotted" message="Loading fulfillments..." />
        )}
        {outboundFulfillmentsError && (
          <CustomTypography color="error">
            {outboundFulfillmentsError}
          </CustomTypography>
        )}
        {!outboundFulfillmentsLoading &&
          !outboundFulfillmentsError &&
          outboundFulfillments.length === 0 && (
            <NoDataFound message="No outbound fulfillments found." />
          )}

        {!outboundFulfillmentsLoading &&
          !outboundFulfillmentsError &&
          outboundFulfillments.length > 0 && (
            <Suspense fallback={<Skeleton height={300} />}>
              <OutboundFulfillmentsTable
                data={outboundFulfillments}
                loading={outboundFulfillmentsLoading}
                page={(outboundFulfillmentsPagination?.page ?? 1) - 1} // convert 1-based → 0-based
                rowsPerPage={outboundFulfillmentsPagination?.limit ?? limit}
                totalRecords={outboundFulfillmentsPagination?.totalRecords ?? 0}
                totalPages={outboundFulfillmentsPagination?.totalPages ?? 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                expandedRowId={expandedRowId}
                onDrillDownToggle={handleDrillDownToggle}
                onRefresh={handleRefresh}
              />
            </Suspense>
          )}
      </Card>
    </Box>
  );
};

export default OutboundFulfillmentsListPage;
