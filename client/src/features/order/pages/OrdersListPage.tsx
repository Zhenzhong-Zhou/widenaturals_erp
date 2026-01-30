import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ORDER_VIEW_MODES } from '@features/order/constants/orderViewModes';
import { isValidOrderCategory } from '@features/order/utils';
import {
  type OrderCategory,
  toPermissionValue,
} from '@utils/constants/orderPermissions';
import {
  useHasPermission,
  usePagePermissionState,
} from '@features/authorize/hooks';
import usePaginatedOrders from '@hooks/usePaginatedOrders';
import { usePaginationHandlers } from '@utils/hooks';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import type {
  OrderListFilters,
  OrderListSortField,
  OrderPermissionContext,
} from '@features/order/state';
import {
  CustomButton,
  CustomTypography,
  GoBackButton,
  Loading,
  NoDataFound
} from '@components/index';
import { AccessDeniedPage } from '@pages/system';
import {
  OrderFiltersPanel,
  OrderSortControls,
} from '@features/order/components/OrdersTable';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';

const OrdersTable = lazy(
  () => import('@features/order/components/OrdersTable/OrdersTable')
);

const OrdersListPage = () => {
  const { mode } = useParams<{ mode?: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<OrderListSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<OrderListFilters>(
    {} as OrderListFilters
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // UI permissions
  const { isAllowed: canCreateSalesOrder } =
    usePagePermissionState(
      toPermissionValue('CREATE', 'sales')
    );
  
  const canCreateSalesOrderInSalesMode =
    mode === 'sales' && canCreateSalesOrder;
  
  // Config permissions
  const hasPermission = useHasPermission();
  
  const permissionCtx = useMemo<OrderPermissionContext>(
    () => ({
      has: (perm) => hasPermission(perm) === true,
      hasAny: (perms) => hasPermission(perms) === true,
    }),
    [hasPermission]
  );
  
  const {
    orders,
    pagination,
    loading: ordersLoading,
    error: ordersError,
    fetchOrders,
    resetOrders,
  } = usePaginatedOrders();

  const isValidMode = mode && isValidOrderCategory(mode);
  const modeConfig = isValidMode
    ? ORDER_VIEW_MODES[mode as OrderCategory]
    : undefined;

  // Build base filters from config
  useEffect(() => {
    if (!modeConfig) return;
    
    let baseFilters = modeConfig.buildBaseFilters(permissionCtx);
    
    if (modeConfig.applyAllocationVisibility) {
      baseFilters = modeConfig.applyAllocationVisibility(
        permissionCtx,
        baseFilters
      );
    }
    
    setFilters(baseFilters);
  }, [modeConfig, permissionCtx]);

  // Memoize the query parameters to avoid unnecessary re-renders or function calls
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
      fetchFn: (params: Record<string, any>) => {
        const cleanCategory = typeof mode === 'string' ? mode.trim() : '';
        fetchOrders(cleanCategory, params); // or sanitizeString(mode)
      },
    }),
    [page, limit, sortBy, sortOrder, filters, fetchOrders, mode]
  );

  // Fetch when dependency change
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFiltersAndSorting(queryParams);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeout);
  }, [queryParams]);

  useEffect(() => {
    return () => {
      resetOrders();
    };
  }, [resetOrders]);

  // Stable refresh handler
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
    resetOrders();
    
    if (modeConfig) {
      let baseFilters = modeConfig.buildBaseFilters(permissionCtx);
      
      if (modeConfig.applyAllocationVisibility) {
        baseFilters = modeConfig.applyAllocationVisibility(
          permissionCtx,
          baseFilters
        );
      }
      
      setFilters(baseFilters);
    }
    
    setPage(1);
  };
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  if (!modeConfig || !modeConfig.canSee(permissionCtx)) {
    return <AccessDeniedPage />;
  }

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
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
        <CustomTypography variant="h5">Order Management</CustomTypography>
        <GoBackButton sx={{ borderRadius: 20 }} />
        {canCreateSalesOrderInSalesMode && (
          <CustomButton
            variant="contained"
            onClick={() => navigate(`/orders/${mode}/new`)}
          >
            Create Sales Order
          </CustomButton>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          {/* Filter fields */}
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <OrderFiltersPanel
              filters={filters}
              onChange={(newFilters) => setFilters(newFilters)}
              onApply={() => {
                setPage(1);
              }}
              onReset={handleResetFilters}
            />
          </Grid>

          {/* Sort Controls */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OrderSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      <Box>
        {ordersLoading && (
          <Loading variant="dotted" message="Loading addresses..." />
        )}

        {!ordersLoading && ordersError && (
          <CustomTypography color="error">{ordersError}</CustomTypography>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <NoDataFound message="No addresses found." />
        )}
        
        {!ordersLoading && !ordersError && pagination && orders.length > 0 && (
          <Suspense fallback={<Skeleton height={300} />}>
            <OrdersTable
              category={mode || 'sales'}
              data={orders}
              loading={ordersLoading}
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
          </Suspense>
        )}
      </Box>
    </Box>
  );
};

export default OrdersListPage;
