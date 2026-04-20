import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { CustomTypography } from '@components/index';
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

const WarehouseListPage: FC = () => {
  const [sortBy, setSortBy]       = useState<WarehouseSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters]     = useState<WarehouseFilters>({});
  
  const {
    data:         warehouses,
    loading:      warehousesLoading,
    error:        warehousesError,
    totalRecords: totalWarehouseRecords,
    pagination:   warehousePagination,
    pageInfo:     warehousePageInfo,
    fetchWarehouses,
    resetWarehouses,
  } = usePaginatedWarehouses();
  
  const hasPermission = useHasPermissionBoolean();
  
  const canViewSummary = hasPermission('view_warehouse_summary');
  const canViewDetails   = hasPermission('view_warehouse_details');
  const canViewInventory = hasPermission('view_warehouse_inventory');
  
  const queryParams = useMemo<WarehouseQueryParams>(
    () => ({
      page:    warehousePageInfo.page,
      limit:   warehousePageInfo.limit,
      sortBy,
      sortOrder,
      filters,
    }),
    [warehousePageInfo.page, warehousePageInfo.limit, sortBy, sortOrder, filters]
  );
  
  useEffect(() => {
    fetchWarehouses(queryParams);
    return () => { resetWarehouses(); };
  }, [queryParams, fetchWarehouses, resetWarehouses]);
  
  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchWarehouses({ ...queryParams, page: newPage + 1 });
    },
    [queryParams, fetchWarehouses]
  );
  
  const handleRowsPerPageChange = useCallback(
    (newLimit: number) => {
      fetchWarehouses({ ...queryParams, page: 1, limit: newLimit });
    },
    [queryParams, fetchWarehouses]
  );
  
  const handleRefresh = useCallback(() => {
    fetchWarehouses(queryParams);
  }, [queryParams, fetchWarehouses]);
  
  const handleResetFilters = useCallback(() => {
    resetWarehouses();
    setFilters({});
  }, [resetWarehouses]);
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
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
        <CustomTypography color="error">{warehousesError}</CustomTypography>
      ) : (
        <WarehouseListTable
          data={warehouses}
          loading={warehousesLoading}
          page={warehousePageInfo.page - 1}
          rowsPerPage={warehousePageInfo.limit}
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
