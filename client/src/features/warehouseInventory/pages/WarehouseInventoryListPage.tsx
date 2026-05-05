import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import {
  CustomTypography,
  ErrorMessage,
  GoBackButton,
} from '@components/index';
import {
  WarehouseInventoryFiltersPanel,
  WarehouseInventoryListTable,
  WarehouseInventorySortControls,
} from '@features/warehouseInventory/components/WarehouseInventoryListTable';
import { WarehouseSummarySection } from '@features/warehouseInventory/components/WarehouseSummaryHeader';
import type {
  FlattenedWarehouseInventory,
  WarehouseInventoryFilters,
  WarehouseInventoryQueryParams,
  WarehouseInventorySortField,
} from '@features/warehouseInventory';
import {
  usePaginatedWarehouseInventory,
  useWarehouseItemSummary,
  useWarehouseSummary,
} from '@hooks/index';
import { useHasPermissionBoolean } from '@features/authorize/hooks';
import { usePaginationHandlers } from '@utils/hooks';
import { useWarehouseInventoryLookups } from '@features/warehouseInventory/hooks';
import { createOnOpenHandler } from '@features/lookup/utils/lookupUtils';
import { WarehouseItemSummaryPanel } from '@features/warehouseInventory/components/WarehouseItemSummary';
import { useRecentWarehouses } from '@features/warehouse/hooks';

const INITIAL_FILTERS: WarehouseInventoryFilters = {};

const WarehouseInventoryListPage: FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<WarehouseInventorySortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] =
    useState<WarehouseInventoryFilters>(INITIAL_FILTERS);

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    warehouseInfo,
    totals,
    byBatchType,
    byStatus,
    alerts,
    loading: summaryLoading,
    error: summaryError,
    fetchSummary,
    resetSummary,
  } = useWarehouseSummary();

  const {
    data: inventories,
    loading: inventoriesLoading,
    error: inventoriesError,
    totalRecords: totalInventoryRecords,
    pagination: inventoryPagination,
    fetchWarehouseInventory,
    resetWarehouseInventory,
  } = usePaginatedWarehouseInventory();

  const {
    loading: itemSummaryLoading,
    error: itemSummaryError,
    products,
    packagingMaterials,
    isEmpty: itemSummaryEmpty,
    fetchItemSummary,
    resetItemSummary,
  } = useWarehouseItemSummary();

  const { addRecent } = useRecentWarehouses();
  const lookups = useWarehouseInventoryLookups();
  const hasPermission = useHasPermissionBoolean();

  const canViewInventoryDetail = hasPermission(
    'view_warehouse_inventory_detail'
  );
  const canCreateInventory = hasPermission('create_warehouse_inventory');
  const canAdjustInventory = hasPermission('adjust_warehouse_inventory');
  const canAdjustReserved = hasPermission('force_adjust_reserved');
  const canUpdateInventoryStatus = hasPermission(
    'update_warehouse_inventory_status'
  );
  const canViewWarehouseSummary = hasPermission(
    'view_warehouse_inventory_summary'
  );
  const canViewWarehouseItemsSummary = hasPermission(
    'view_warehouse_inventory_summary_item_details'
  );

  // Warehouse summary
  useEffect(() => {
    if (!warehouseId || !canViewWarehouseSummary) return;
    if (warehouseInfo?.id === warehouseId) return;
    fetchSummary(warehouseId);
  }, [warehouseId, warehouseInfo?.id, canViewWarehouseSummary, fetchSummary]);

  // Item summary
  useEffect(() => {
    if (!warehouseId || !canViewWarehouseItemsSummary) return;
    fetchItemSummary({ warehouseId });
  }, [warehouseId, canViewWarehouseItemsSummary, fetchItemSummary]);

  useEffect(
    () => () => {
      resetSummary();
      resetItemSummary();
    },
    [resetSummary, resetItemSummary]
  );

  useEffect(() => {
    if (!warehouseInfo) return;
    addRecent({
      id: warehouseInfo.id,
      name: warehouseInfo.name,
      code: warehouseInfo.code,
    });
  }, [warehouseInfo, addRecent]);

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

  const refreshWarehouseInventoryList = useCallback(() => {
    if (!warehouseId) return;
    fetchWarehouseInventory({ warehouseId, ...fullQuery });
  }, [warehouseId, fullQuery, fetchWarehouseInventory]);

  const queryParams = useMemo<WarehouseInventoryQueryParams | null>(() => {
    if (!warehouseId) return null;
    return {
      warehouseId,
      ...fullQuery,
      fetchFn: refreshWarehouseInventoryList,
    };
  }, [warehouseId, fullQuery, refreshWarehouseInventoryList]);

  // Fetch effect — fires whenever queryParams change
  useEffect(() => {
    if (!warehouseId) return;
    const t = setTimeout(
      () => fetchWarehouseInventory({ warehouseId, ...fullQuery }),
      200
    );
    return () => clearTimeout(t);
  }, [warehouseId, fullQuery, fetchWarehouseInventory]);

  // Reset effect — fires ONLY on unmount
  useEffect(() => {
    return () => {
      resetWarehouseInventory();
    };
  }, [resetWarehouseInventory]);

  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleResetFilters = useCallback(() => {
    resetWarehouseInventory();
    setFilters(INITIAL_FILTERS);
    setSelectedIds([]);
  }, [resetWarehouseInventory]);

  // Derive full selected item objects from current page data
  const selectedItems = useMemo<FlattenedWarehouseInventory[]>(() => {
    const set = new Set(selectedIds);
    return inventories.filter((row) => set.has(row.id));
  }, [inventories, selectedIds]);

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);
  
  const lookupHandlers = useMemo(
    () => ({
      onOpen: {
        // inventoryStatus:   createOnOpenHandler(lookups.inventoryStatus),
        product: createOnOpenHandler(lookups.product),
        sku: createOnOpenHandler(lookups.sku),
        packagingMaterial: createOnOpenHandler(lookups.packagingMaterial),
      },
    }),
    [lookups.product, lookups.sku, lookups.packagingMaterial]
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
      {/* Back navigation — its own row */}
      <Box mb={2}>
        <GoBackButton variant="outlined" />
      </Box>

      {canViewWarehouseSummary && (
        <WarehouseSummarySection
          warehouseInfo={warehouseInfo}
          totals={totals}
          byBatchType={byBatchType}
          byStatus={byStatus}
          alerts={alerts}
          loading={summaryLoading}
          error={summaryError}
        />
      )}

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
                if (queryParams)
                  fetchWarehouseInventory({ ...queryParams, page: 1 });
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
        <ErrorMessage message={inventoriesError} showNavigation />
      ) : (
        <WarehouseInventoryListTable
          data={inventories}
          loading={inventoriesLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={totalInventoryRecords}
          totalPages={inventoryPagination?.totalPages ?? 0}
          warehouseId={warehouseId}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRefresh={refreshWarehouseInventoryList}
          selectedRowIds={selectedIds}
          selectedItems={selectedItems}
          onSelectionChange={handleSelectionChange}
          canViewDetail={canViewInventoryDetail}
          canCreate={canCreateInventory}
          canAdjust={canAdjustInventory}
          canAdjustReserved={canAdjustReserved}
          canUpdateStatus={canUpdateInventoryStatus}
        />
      )}

      {/* ── Item Summary Panel ── */}
      {canViewWarehouseItemsSummary && itemSummaryLoading ? (
        <Skeleton variant="rectangular" height={200} sx={{ mt: 4 }} />
      ) : canViewWarehouseItemsSummary && !itemSummaryEmpty ? (
        <WarehouseItemSummaryPanel
          products={products}
          packagingMaterials={packagingMaterials}
          loading={itemSummaryLoading}
          error={itemSummaryError}
        />
      ) : null}
    </Box>
  );
};

export default WarehouseInventoryListPage;
