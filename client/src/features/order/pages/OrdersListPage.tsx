import { useNavigate, useParams } from 'react-router-dom';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import usePermissions from '@hooks/usePermissions';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';
import { ORDER_VIEW_MODES } from '@features/order/constants/orderViewModes';
import { type OrderCategory, toPermissionValue } from '@utils/constants/orderPermissions';
import Loading from '@components/common/Loading';
import AccessDeniedPage from '@pages/AccessDeniedPage';
import CustomButton from '@components/common/CustomButton';
import { hasPermission } from '@utils/permissionUtils';
import useIsRootUser from '@features/authorize/hooks/useIsRootUser';
import usePaginatedOrders from '@hooks/usePaginatedOrders';
import type { OrderListFilters, OrderListSortField } from '@features/order/state';
import { usePaginationHandlers } from '@utils/hooks/usePaginationHandlers';
import { applyFiltersAndSorting } from '@utils/queryUtils';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import OrderSortControls from '@features/order/components/OrderSortControls';
import NoDataFound from '@components/common/NoDataFound';

const OrdersTable = lazy(
  () => import('@features/order/components/OrdersTable')
);

const OrdersListPage = () => {
  const { mode } = useParams<{ mode?: string }>();
  const navigate = useNavigate();
  // todo: copy customer table

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<OrderListSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<OrderListFilters>({} as OrderListFilters);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const isRoot = useIsRootUser();
  const { roleName, permissions, loading } = usePermissions();
  
  const {
    orders,
    pagination,
    loading: ordersLoading,
    error: ordersError,
    fetchOrders,
    resetOrders,
  } = usePaginatedOrders();
  
  const isValidMode = mode && isValidOrderCategory(mode);
  const modeConfig = isValidMode ? ORDER_VIEW_MODES[mode as OrderCategory] : undefined;
  
  const ctx = useMemo(
    () => ({
      isRoot,
      has: (perm: string) => hasPermission(perm, permissions, roleName),
      hasAny: (perms: string[]) => isRoot || perms.some((p) => hasPermission(p, permissions, roleName)),
    }),
    [isRoot, permissions, roleName]
  );
  
  // Build base filters from config
  useEffect(() => {
    if (modeConfig) {
      let baseFilters = modeConfig.buildBaseFilters(ctx);
      if (modeConfig.applyAllocationVisibility) {
        baseFilters = modeConfig.applyAllocationVisibility(ctx, baseFilters);
      }
      setFilters(baseFilters);
    }
  }, [modeConfig, ctx]);
  
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
      let baseFilters = modeConfig.buildBaseFilters(ctx);
      if (modeConfig.applyAllocationVisibility) {
        baseFilters = modeConfig.applyAllocationVisibility(ctx, baseFilters);
      }
      setFilters(baseFilters);
    }
    setPage(1);
  };
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  if (loading) return <Loading variant={'dotted'} />;
  
  if (!modeConfig || !modeConfig.canSee(ctx)) {
    return (
     <AccessDeniedPage/>
    );
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
        <CustomTypography variant="h5">
          Order Management
        </CustomTypography>
        <GoBackButton sx={{ borderRadius: 20 }} />
        {mode === 'sales' && ctx.has(toPermissionValue('CREATE', 'sales')) && (
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
           // todo: add filter panel
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
        
        {!ordersLoading && !ordersError && orders.length > 0 && (
          <Suspense fallback={<Skeleton height={300} />}>
            <OrdersTable
              category={mode || 'sales'}
              data={orders}
              loading={ordersLoading}
              page={page - 1}
              rowsPerPage={limit}
              totalRecords={pagination.totalRecords || 0}
              totalPages={pagination.totalPages || 0}
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
