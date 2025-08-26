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
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';

const OrdersTable = lazy(
  () => import('@features/order/components/OrdersTable')
);

const OrdersListPage = () => {
  const { mode } = useParams<{ mode?: string }>();
  const navigate = useNavigate();
  // todo: copy customer table
  // todo: filters are differ approach
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<OrderListSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<OrderListFilters>({} as OrderListFilters);
  
  const isRoot = useIsRootUser();
  const { roleName, permissions, loading } = usePermissions();
  
  const {
    orders,
    pagination,
    // filters,
    loading: ordersLoading,
    error,
    fetchOrders,
    resetOrders,
    updateFilters,
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
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  // Stable refresh handler
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
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
  
  if (loading) return <Loading />;
  
  if (!modeConfig || !modeConfig.canSee(ctx)) {
    return (
     <AccessDeniedPage/>
    );
  }
  
  return (
    <>
      <CustomTypography variant="h5">Orders</CustomTypography>
      <GoBackButton sx={{ borderRadius: 20 }} />
      <CustomButton
        variant="contained"
        sx={{ boxShadow: 2 }}
        onClick={handleRefresh}
      >
        Refresh Table
      </CustomButton>
      {mode === 'sales' && ctx.has(toPermissionValue('CREATE', 'sales')) && (
        <CustomButton
          variant="contained"
          onClick={() => navigate('/orders/sales/new')}
        >
          Create Sales Order
        </CustomButton>
      )}
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
          onRefresh={handleRefresh}
        />
      </Suspense>
    </>
  );
};

export default OrdersListPage;