import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import {
  CustomButton,
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
import { usePaginationHandlers } from '@utils/hooks';
import {
  useWarehouseInventoryLookups,
  useWarehouseInventoryPermissions
} from '@features/warehouseInventory/hooks';
import { createOnOpenHandler } from '@features/lookup/utils/lookupUtils';
import { WarehouseItemSummaryPanel } from '@features/warehouseInventory/components/WarehouseItemSummary';
import { useRecentWarehouses } from '@features/warehouse/hooks';
import { Stack } from '@mui/material';

const INITIAL_FILTERS: WarehouseInventoryFilters = {};

const WarehouseInventoryListPage: FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
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
  
  const {
    canAdjustInventory,
    canAdjustReserved,
    canUpdateInventoryStatus,
    canViewInventoryDetail,
    canCreateInventory,
    canViewWarehouseSummary,
    canViewWarehouseItemsSummary,
    canViewInventoryActivityLog,
  } = useWarehouseInventoryPermissions();

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
  
  const queryParams = useMemo<WarehouseInventoryQueryParams | null>(() => {
    if (!warehouseId) return null;
    return { warehouseId, ...fullQuery };
  }, [warehouseId, fullQuery]);
  
  const refreshWarehouseInventoryList = useCallback(() => {
    if (!queryParams) return;
    fetchWarehouseInventory(queryParams);
  }, [queryParams, fetchWarehouseInventory]);
  
  // Fetch effect — fires whenever queryParams change
  useEffect(() => {
    if (!queryParams) return;
    const t = setTimeout(() => fetchWarehouseInventory(queryParams), 200);
    return () => clearTimeout(t);
  }, [queryParams, fetchWarehouseInventory]);

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
        inventoryStatus:   createOnOpenHandler(lookups.inventoryStatus),
        product: createOnOpenHandler(lookups.product),
        sku: createOnOpenHandler(lookups.sku),
        packagingMaterial: createOnOpenHandler(lookups.packagingMaterial),
      },
    }),
    [lookups.inventoryStatus, lookups.product, lookups.sku, lookups.packagingMaterial]
  );
  
  const handleGoToActivityLog = useCallback(() => {
    if (!warehouseId) return;
    navigate(`/warehouse-inventory/${warehouseId}/activity-log`);
  }, [navigate, warehouseId]);

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
      {/* Top toolbar — back + page-level actions */}
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
      >
        <GoBackButton variant="outlined" />
        
        <Stack direction="row" spacing={1.5}>
          {canViewInventoryActivityLog && (
            <CustomButton
              variant="outlined"
              onClick={handleGoToActivityLog}
              sx={{ borderRadius: 999, px: 2.5, height: 44 }}
            >
              Activity Log
            </CustomButton>
          )}
        </Stack>
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
              onApply={(next) => {
                if (!warehouseId) return;
                fetchWarehouseInventory({
                  warehouseId,
                  ...next,
                  page: 1,
                });
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
