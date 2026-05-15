import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Divider, Grid, Stack } from '@mui/material';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  GoBackButton,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  useInventoryActionTypeLookup,
  useInventoryActivityLog,
  useLotAdjustmentTypeLookup,
  useUserLookup,
} from '@hooks/index';
import { useWarehouseInventoryPermissions } from '@features/warehouseInventory/hooks';
import type {
  InventoryActivityLogFilters,
  InventoryActivityLogQueryParams,
  InventoryActivityLogSortField,
} from '@features/warehouseInventory';
import {
  InventoryActivityLogSortControls,
  WarehouseInventoryActivityLogFilterPanel,
  WarehouseInventoryActivityLogListTable,
} from '@features/warehouseInventory/components/WarehouseInventoryActivityLogListTable';
import { usePaginationHandlers } from '@utils/hooks';
import { useFormattedOptionLabels } from '@features/lookup/utils/formatOptionLabels';

/**
 * Full activity log page for a single warehouse.
 *
 * Route: /warehouse-inventory/:warehouseId/activity-log
 *
 * Filters are synced to URL query params so deep links from the
 * detail page (with inventoryId pre-applied) work, and so users
 * can share or bookmark filtered views. Pagination and sort are
 * local state — lift them to the URL later if you want shareable
 * paginated/sorted views.
 *
 * The same data hook (and ultimately the same endpoint) powers
 * the activity log panel inside the detail page; the panel is
 * just this page with the inventoryId filter locked.
 */
const WarehouseInventoryActivityLogPage: FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<InventoryActivityLogSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<InventoryActivityLogFilters>({});

  const { canViewInventoryActivityLog } = useWarehouseInventoryPermissions();

  // -----------------------------
  // Data hook
  // -----------------------------
  const {
    data,
    loading,
    error,
    totalRecords,
    isEmpty,
    pagination: logPagination,
    fetchActivityLog,
    resetActivityLog,
  } = useInventoryActivityLog();

  const {
    options: inventoryActionTypeOptions,
    loading: isInventoryActionTypeLoading,
    error: inventoryActionTypeError,
    meta: inventoryActionTypeMeta,
    fetch: fetchInventoryActionTypeLookup,
    reset: resetInventoryActionTypeLookup,
  } = useInventoryActionTypeLookup();

  const {
    options: lotAdjustmentTypeOptions,
    loading: isLotAdjustmentTypeLoading,
    error: lotAdjustmentTypeError,
    meta: lotAdjustmentTypeMeta,
    fetch: fetchLotAdjustmentTypeLookup,
    reset: resetLotAdjustmentTypeLookup,
  } = useLotAdjustmentTypeLookup();

  const {
    options: userOptions,
    loading: isUserLookupLoading,
    error: userLookupError,
    meta: userLookupMeta,
    fetch: fetchUserLookup,
    reset: resetUserLookup,
  } = useUserLookup();

  const formattedInventoryActionTypeOptions = useFormattedOptionLabels(
    inventoryActionTypeOptions
  );

  const formattedLotAdjustmentTypeOptions = useFormattedOptionLabels(
    lotAdjustmentTypeOptions
  );

  const formattedUserOptions = useFormattedOptionLabels(userOptions);

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

  const queryParams = useMemo<InventoryActivityLogQueryParams | null>(() => {
    if (!warehouseId) return null;
    return { warehouseId, ...fullQuery };
  }, [warehouseId, fullQuery]);

  const refreshInventoryActivityLogList = useCallback(() => {
    if (!queryParams) return;
    fetchActivityLog(queryParams);
  }, [queryParams, fetchActivityLog]);

  // Fetch effect — fires whenever queryParams change
  useEffect(() => {
    if (!queryParams) return;
    const t = setTimeout(() => fetchActivityLog(queryParams), 200);
    return () => clearTimeout(t);
  }, [queryParams, fetchActivityLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetActivityLog();
    };
  }, [resetActivityLog]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );

  const handleResetFilters = useCallback(() => {
    resetActivityLog();
    setFilters({});
    resetUserLookup();
    resetLotAdjustmentTypeLookup();
    resetInventoryActionTypeLookup();
    setPage(1);
  }, [resetActivityLog]);

  // -----------------------------
  // Guards (warehouseId before permission — without an ID there's nothing
  // to authorize against; flipping the order would surface misleading
  // permission errors on malformed routes)
  // -----------------------------
  if (!warehouseId) {
    return (
      <ErrorMessage message="Missing warehouse ID in route." showNavigation />
    );
  }

  if (!canViewInventoryActivityLog) {
    return (
      <ErrorMessage
        message="You do not have permission to view inventory activity logs."
        showNavigation
      />
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* --------------------------------------------------
       * Header — badges + title + actions
       * -------------------------------------------------- */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Stack spacing={0.5}>
            <CustomTypography variant="h5" sx={{ fontWeight: 600 }}>
              Warehouse Inventory Activity Log
            </CustomTypography>
            
            {totalRecords > 0 && (
              <CustomTypography variant="body2" color="text.secondary">
                {totalRecords} {totalRecords === 1 ? 'entry' : 'entries'}
              </CustomTypography>
            )}
          </Stack>
          
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
            }}
          >
            <GoBackButton
              variant="outlined"
              sx={{
                width: 128,
                height: 44,
                px: 2.5,
                borderRadius: 999,
                flexShrink: 0,
              }}
            />
            
            <CustomButton
              variant="outlined"
              onClick={refreshInventoryActivityLogList}
              sx={{
                width: 128,
                height: 44,
                px: 2.5,
                borderRadius: 999,
                flexShrink: 0,
              }}
            >
              Refresh
            </CustomButton>
          </Stack>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* ── Filter + Sort Controls ────────────────────────────────── */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <WarehouseInventoryActivityLogFilterPanel
              filters={filters}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
              inventoryActionTypeOptions={formattedInventoryActionTypeOptions}
              inventoryActionTypeLoading={isInventoryActionTypeLoading}
              inventoryActionTypeError={inventoryActionTypeError}
              inventoryActionTypeMeta={inventoryActionTypeMeta}
              fetchInventoryActionTypeLookup={fetchInventoryActionTypeLookup}
              adjustmentTypeOptions={formattedLotAdjustmentTypeOptions}
              adjustmentTypeLoading={isLotAdjustmentTypeLoading}
              adjustmentTypeError={lotAdjustmentTypeError}
              adjustmentTypeMeta={lotAdjustmentTypeMeta}
              fetchLotAdjustmentTypeLookup={fetchLotAdjustmentTypeLookup}
              userOptions={formattedUserOptions}
              userLoading={isUserLookupLoading}
              userError={userLookupError}
              userMeta={userLookupMeta}
              fetchUserLookup={fetchUserLookup}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <InventoryActivityLogSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* --------------------------------------------------
       * Body — loading / error / empty / table
       * -------------------------------------------------- */}
      {loading && <Loading variant="dotted" message="Loading activity log..." />}
      
      {!loading && error && (
        <ErrorMessage message={error} showNavigation={false} />
      )}
      
      {!loading && !error && isEmpty && (
        <NoDataFound message="No activity log entries match the current filters." />
      )}
      
      {!loading && !error && !isEmpty && (
        <WarehouseInventoryActivityLogListTable
          data={data}
          loading={loading}
          page={page - 1}
          rowsPerPage={limit}
          totalPages={logPagination?.totalPages ?? 0}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          showItemContext
        />
      )}
    </Box>
  );
};

export default WarehouseInventoryActivityLogPage;
