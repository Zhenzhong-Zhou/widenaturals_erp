import {
  useState,
  type SyntheticEvent,
  lazy,
  useCallback,
  startTransition,
  Suspense,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import InventoryOverviewHeaderSection from '@features/inventoryOverview/components/InventoryOverviewHeaderSection';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';
import type {
  InventoryActivityLogEntry,
  InventoryActivityLogQueryParams,
  InventoryLogSource,
} from '@features/report/state';
import { usePaginatedInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import {
  type MergedInventoryActivityLogEntry,
  mergeInventoryActivityLogs,
} from '@features/report/utils/logUtils';

// Lazy loaded panels
const LocationInventorySummaryPanel = lazy(
  () =>
    import('@features/inventoryOverview/components/LocationInventorySummaryPanel')
);
const WarehouseInventorySummaryPanel = lazy(
  () =>
    import('@features/inventoryOverview/components/WarehouseInventorySummaryPanel')
);
const RecentInventoryActivitySection = lazy(
  () => import('@features/report/components/RecentInventoryActivitySection')
);
const InventoryLogDrawer = lazy(
  () => import('@features/report/components/InventoryLogDrawer')
);

const InventoryOverviewPage = () => {
  const [tab, setTab] = useState(0); // 0 = Location, 1 = Warehouse
  const [locationState, setLocationState] = useState({
    itemTypeTab: 0,
    page: 1,
    limit: 20,
  });
  const [warehouseState, setWarehouseState] = useState({
    itemTypeTab: 0,
    page: 1,
    limit: 20,
  });
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logDrawerRow, setLogDrawerRow] = useState<InventoryLogSource | null>(
    null
  );
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(25);
  const [filters, setFilters] = useState<
    Partial<InventoryActivityLogQueryParams>
  >({});
  // const [stagedFilters, setStagedFilters] = useState<Partial<InventoryActivityLogQueryParams>>({});
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const openButtonRef = useRef<HTMLElement>(null);

  const { itemTypeTab, page, limit } =
    tab === 0 ? locationState : warehouseState;

  const itemType: ItemType | undefined =
    itemTypeTab === 1
      ? 'product'
      : itemTypeTab === 2
        ? 'packaging_material'
        : undefined;

  const { permissions } = usePermissions();
  const hasPermission = useHasPermission(permissions);

  // Memoize permission checks
  const canViewBasicLogs = useMemo(
    () => hasPermission(['view_inventory_logs']),
    [hasPermission]
  );

  const canViewInventoryLogs = useMemo(
    () =>
      hasPermission(['view_all_sku_logs', 'view_all_packing_material_logs']),
    [hasPermission]
  );

  const {
    data: logData,
    pagination,
    loading: logLoading,
    error: logError,
    fetchLogs,
  } = usePaginatedInventoryActivityLogs();

  const queryParams = useMemo(
    () => ({
      page: logPage,
      limit: logLimit,
      ...filters,
    }),
    [logPage, logLimit, filters]
  );

  // Fetch on mount or when page/limit changes
  useEffect(() => {
    fetchLogs(queryParams); // server expects 1-based page
  }, [queryParams, fetchLogs]);

  const mergedData: MergedInventoryActivityLogEntry[] = useMemo(
    () => mergeInventoryActivityLogs(logData),
    [logData]
  );

  const handleTabChange = (_: SyntheticEvent, newTab: number) => {
    startTransition(() => {
      setTab(newTab);
    });
  };

  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    startTransition(() => {
      if (tab === 0) {
        setLocationState((prev) => ({
          ...prev,
          itemTypeTab: newValue,
          page: 1,
        }));
      } else {
        setWarehouseState((prev) => ({
          ...prev,
          itemTypeTab: newValue,
          page: 1,
        }));
      }
    });
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (tab === 0) {
        setLocationState((prev) => ({ ...prev, page: newPage + 1 }));
      } else {
        setWarehouseState((prev) => ({ ...prev, page: newPage + 1 }));
      }
    },
    [tab]
  );

  const handleRowsPerPageChange = useCallback(
    (newLimit: number) => {
      if (tab === 0) {
        setLocationState((prev) => ({ ...prev, limit: newLimit, page: 1 }));
      } else {
        setWarehouseState((prev) => ({ ...prev, limit: newLimit, page: 1 }));
      }
    },
    [tab]
  );

  const handleViewLogs = (
    row: InventoryLogSource,
    extraFilters: Partial<InventoryActivityLogQueryParams> = {}
  ) => {
    const itemId = row.itemId;
    const type = row.itemType;

    const baseFilter: Partial<InventoryActivityLogQueryParams> =
      type === 'product'
        ? { skuIds: [itemId] }
        : type === 'packaging_material'
          ? { packagingMaterialIds: [itemId] }
          : {};

    const mergedFilter = { ...baseFilter, ...extraFilters };

    setFilters(mergedFilter);
    setLogDrawerRow({
      itemId,
      itemType: type,
    });
    setLogDrawerOpen(true);
    setLogPage(1); // reset pagination when switching rows
  };

  const handleLogSelectionChange = (ids: string[]) => {
    setSelectedRowIds(ids);
  };

  const handleClose = () => {
    setLogDrawerOpen(false);
    setTimeout(() => {
      if (!logDrawerOpen) {
        openButtonRef.current?.focus();
      }
    }, 300);
  };

  const handleExpandToggle = (row: InventoryActivityLogEntry) => {
    const rowId = row.id ?? '';
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const isRowExpanded = (row: InventoryActivityLogEntry) => {
    return row.id === expandedRowId;
  };

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Page Header */}
      <InventoryOverviewHeaderSection />

      {canViewBasicLogs && (
        <>
          {/* Spacer */}
          <Divider sx={{ mt: 4, mb: 4 }} />

          {/* Logs section */}
          <Suspense fallback={<Skeleton height={200} />}>
            <RecentInventoryActivitySection />
          </Suspense>
        </>
      )}

      {/* Spacer */}
      <Divider sx={{ mt: 4, mb: 4 }} />

      {/* Inventory Management */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <CustomTypography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Inventory Management
        </CustomTypography>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Location Inventory Summary" />
          <Tab label="Warehouse Inventory Summary" />
        </Tabs>

        {(tab === 0 || tab === 1) && (
          <Box mt={2}>
            <ItemTypeTabs
              value={itemTypeTab}
              onChange={handleItemTypeTabChange}
            />
          </Box>
        )}
      </Paper>

      {/* Summary Panels */}
      <Suspense
        fallback={
          <Skeleton
            height={420}
            variant="rectangular"
            sx={{ borderRadius: 2, mb: 2 }}
          />
        }
      >
        {tab === 0 ? (
          <LocationInventorySummaryPanel
            page={page}
            limit={limit}
            itemType={itemType}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            canViewInventoryLogs={canViewInventoryLogs}
            onViewLogs={handleViewLogs}
          />
        ) : (
          <WarehouseInventorySummaryPanel
            page={page}
            limit={limit}
            itemType={itemType}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            canViewInventoryLogs={canViewInventoryLogs}
            onViewLogs={handleViewLogs}
          />
        )}
      </Suspense>

      {logDrawerRow && (
        <InventoryLogDrawer
          open={logDrawerOpen}
          onClose={handleClose}
          row={logDrawerRow}
          returnFocusRef={openButtonRef}
          data={mergedData}
          loading={logLoading}
          error={logError}
          page={logPage}
          totalPages={pagination?.totalPages ?? 1}
          totalRecords={pagination?.totalRecords ?? 0}
          rowsPerPage={logLimit}
          onPageChange={setLogPage}
          onRowsPerPageChange={setLogLimit}
          selectedRowIds={selectedRowIds}
          onSelectionChange={handleLogSelectionChange}
          expandedRowId={expandedRowId}
          onExpandToggle={handleExpandToggle}
          isRowExpanded={isRowExpanded}
          onRetry={() => fetchLogs(queryParams)}
        />
      )}
    </Box>
  );
};

export default InventoryOverviewPage;
