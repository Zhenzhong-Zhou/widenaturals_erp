import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { CustomTypography, ErrorMessage } from '@components/index';
import {
  WarehouseFiltersPanel,
  WarehouseListTable,
  WarehouseSortControls,
} from '@features/warehouse/components/WarehouseListTable';
import type {
  WarehouseFilters,
  WarehouseQueryParams,
  WarehouseSortField,
} from '@features/warehouse';
import { usePaginatedWarehouses } from '@hooks/index';
import { useHasPermissionBoolean } from '@features/authorize/hooks';
import { PERMISSION_KEYS } from '@features/authorize/constants/permissionKeys';
import { usePaginationHandlers } from '@utils/hooks';

const WarehouseListPage: FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] =
    useState<WarehouseSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<WarehouseFilters>({});

  const {
    data: warehouses,
    loading: warehousesLoading,
    error: warehousesError,
    totalRecords: totalWarehouseRecords,
    pagination: warehousePagination,
    fetchWarehouses,
    resetWarehouses,
  } = usePaginatedWarehouses();

  const hasPermission = useHasPermissionBoolean();

  const canViewSummary = hasPermission(
    PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY
  );
  const canViewDetails = hasPermission(
    PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_DETAILS
  );
  const canViewInventory = hasPermission(
    PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW
  );

  const queryParams = useMemo<WarehouseQueryParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    }),
    [page, limit, sortBy, sortOrder, filters]
  );

  // Fetch on params change
  useEffect(() => {
    fetchWarehouses(queryParams);
  }, [queryParams, fetchWarehouses]);

  // Cleanup ONLY on unmount
  useEffect(
    () => () => {
      resetWarehouses();
    },
    [resetWarehouses]
  );

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleRefresh = useCallback(() => {
    fetchWarehouses(queryParams);
  }, [queryParams, fetchWarehouses]);

  const handleResetFilters = useCallback(() => {
    setPage(1);
    resetWarehouses();
    setFilters({});
  }, [resetWarehouses]);

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 3,
          gap: 2,
        }}
      >
        <CustomTypography variant="h5" sx={{ fontWeight: 700 }}>
          Warehouse Management
        </CustomTypography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── Filter + Sort Controls ────────────────────────────────── */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <WarehouseFiltersPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => fetchWarehouses({ ...queryParams, page: 1 })}
              onReset={handleResetFilters}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <WarehouseSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>

      {/* ── Table ─────────────────────────────────────────────────── */}
      {warehousesError ? (
        <ErrorMessage message={warehousesError} showNavigation />
      ) : (
        <WarehouseListTable
          data={warehouses}
          loading={warehousesLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={totalWarehouseRecords}
          totalPages={warehousePagination?.totalPages ?? 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRefresh={handleRefresh}
          canViewSummary={canViewSummary}
          canViewDetails={canViewDetails}
          canViewInventory={canViewInventory}
        />
      )}
    </Box>
  );
};

export default WarehouseListPage;
