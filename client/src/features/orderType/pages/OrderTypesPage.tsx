import { type FC, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import usePaginateOrderTypes from '@hooks/usePaginateOrderTypes';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import OrderTypeFiltersPanel from '@features/orderType/components/OrderTypeFiltersPanel';
import OrderTypeSortControls from '@features/orderType/components/OrderTypeSortControls';
import OrderTypesTable from '@features/orderType/components/OrderTypesTable';
import NoDataFound from '@components/common/NoDataFound';
import type {
  OrderTypeFilters,
  OrderTypeSortBy,
} from '@features/orderType/state';
import type { SortOrder } from '@shared-types/api';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import { usePaginationHandlers } from '@utils/hooks';

const OrderTypesPage: FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<OrderTypeSortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('');
  const [filters, setFilters] = useState<OrderTypeFilters>({});

  const {
    data: orderTypes,
    pagination: orderTypePagination,
    loading: isOrderTypeLoading,
    error: orderTypeError,
    fetchData: fetchOrderTypes,
    reset: resetOrderTypes,
  } = usePaginateOrderTypes();

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: fetchOrderTypes,
    }),
    [page, limit, sortBy, sortOrder, filters, fetchOrderTypes]
  );

  useEffect(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleRefresh = () => {
    resetOrderTypes();
    applyFiltersAndSorting(queryParams);
  };

  const handleResetFilters = () => {
    setFilters({});
    setSortBy('name');
    setSortOrder('');
    setPage(1);
  };

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Page Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        spacing={2}
        mb={3}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          Order Types
        </CustomTypography>
        {/* Add a button or right-hand action here if needed */}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Filters and Sorting Panel */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {/* Filters */}
          <Grid size={{ xs: 12, md: 9 }}>
            <OrderTypeFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>

          {/* Sort controls or action area */}
          <Grid size={{ xs: 12, md: 3 }}>
            <OrderTypeSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Table + Result Handling */}
      <Box>
        {isOrderTypeLoading ? (
          <Loading message="Loading Order Types..." />
        ) : orderTypeError ? (
          <ErrorDisplay>
            <ErrorMessage message={orderTypeError} />
          </ErrorDisplay>
        ) : orderTypes.length > 0 ? (
          <OrderTypesTable
            loading={isOrderTypeLoading}
            data={orderTypes}
            page={page - 1}
            rowsPerPage={limit}
            totalRecords={orderTypePagination?.totalRecords || 0}
            totalPages={orderTypePagination?.totalPages || 0}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRefresh={handleRefresh}
          />
        ) : (
          <NoDataFound message="No order types found." />
        )}
      </Box>
    </Box>
  );
};

export default OrderTypesPage;
