import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { CustomTypography } from '@components/index';
import {
  WarehouseInventoryFiltersPanel,
  WarehouseInventoryListTable,
  WarehouseInventorySortControls,
} from '@features/warehouseInventory/components/WarehouseInventoryListTable';
import type {
  WarehouseInventoryFilters,
  WarehouseInventoryQueryParams,
  WarehouseInventorySortField,
} from '@features/warehouseInventory';
import { usePaginatedWarehouseInventory } from '@hooks/index';
import { useHasPermissionBoolean } from '@features/authorize/hooks';
import { usePaginationHandlers } from '@utils/hooks';
import { useWarehouseInventoryLookups } from '@features/warehouseInventory/hooks';
import { createOnOpenHandler } from '@features/lookup/utils/lookupUtils';

const WarehouseInventoryListPage: FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy]       = useState<WarehouseInventorySortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters]     = useState<WarehouseInventoryFilters>({});
  
  const {
    data:         inventories,
    loading:      inventoriesLoading,
    error:        inventoriesError,
    totalRecords: totalInventoryRecords,
    pagination:   inventoryPagination,
    fetchWarehouseInventory,
    resetWarehouseInventory,
  } = usePaginatedWarehouseInventory();
  
  const lookups = useWarehouseInventoryLookups();
  
  const hasPermission = useHasPermissionBoolean();
  
  const canViewInventoryDetail   = hasPermission('view_warehouse_inventory_detail');
  const canAdjustInventory       = hasPermission('adjust_warehouse_inventory');
  const canUpdateInventoryStatus = hasPermission('update_warehouse_inventory_status');
  
  const queryParams = useMemo<WarehouseInventoryQueryParams | null>(
    () => {
      if (!warehouseId) return null;
      return {
        warehouseId,
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      };
    },
    [warehouseId, page, limit, sortBy, sortOrder, filters]
  );

  // Fetch effect — fires whenever queryParams change
  useEffect(() => {
    if (!queryParams) return;
    fetchWarehouseInventory(queryParams);
  }, [queryParams, fetchWarehouseInventory]);

  // Reset effect — fires ONLY on unmount
  useEffect(() => {
    return () => { resetWarehouseInventory(); };
  }, [resetWarehouseInventory]);
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit,
  );
  
  const handleRefresh = useCallback(() => {
    if (!queryParams) return;
    fetchWarehouseInventory(queryParams);
  }, [queryParams, fetchWarehouseInventory]);
  
  const handleResetFilters = useCallback(() => {
    resetWarehouseInventory();
    setFilters({});
  }, [resetWarehouseInventory]);
  
  const lookupHandlers = useMemo(
    () => ({
      onOpen: {
        // inventoryStatus:   createOnOpenHandler(lookups.inventoryStatus),
        product:           createOnOpenHandler(lookups.product),
        sku:               createOnOpenHandler(lookups.sku),
        packagingMaterial: createOnOpenHandler(lookups.packagingMaterial),
      },
    }),
    [lookups]
  );
  
  if (!warehouseId) {
    return (
      <Box sx={{ px: 4, py: 3 }}>
        <CustomTypography color="error">
          Missing warehouse ID in route.
        </CustomTypography>
      </Box>
    );
  }
  
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
          Warehouse Inventory
        </CustomTypography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* ── Filter + Sort Controls ────────────────────────────────── */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <WarehouseInventoryFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => {
                if (queryParams) fetchWarehouseInventory({ ...queryParams, page: 1 });
              }}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <WarehouseInventorySortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* ── Table ─────────────────────────────────────────────────── */}
      {inventoriesError ? (
        <CustomTypography color="error">{inventoriesError}</CustomTypography>
      ) : (
        <WarehouseInventoryListTable
          data={inventories}
          loading={inventoriesLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={totalInventoryRecords}
          totalPages={inventoryPagination?.totalPages ?? 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRefresh={handleRefresh}
          canViewDetail={canViewInventoryDetail}
          canAdjust={canAdjustInventory}
          canUpdateStatus={canUpdateInventoryStatus}
        />
      )}
    </Box>
  );
};

export default WarehouseInventoryListPage;
