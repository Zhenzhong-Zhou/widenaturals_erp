import {
  useState,
  type SyntheticEvent,
  lazy,
  useCallback,
  startTransition,
  Suspense,
} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import InventoryOverviewHeaderSection from '@features/inventoryOverview/components/InventoryOverviewHeaderSection';
import Divider from '@mui/material/Divider';

// Lazy loaded panels
const LocationInventorySummaryPanel = lazy(
  () =>
    import(
      '@features/inventoryOverview/components/LocationInventorySummaryPanel'
    )
);
const WarehouseInventorySummaryPanel = lazy(
  () =>
    import(
      '@features/inventoryOverview/components/WarehouseInventorySummaryPanel'
    )
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

  const { itemTypeTab, page, limit } =
    tab === 0 ? locationState : warehouseState;

  const itemType: ItemType | undefined =
    itemTypeTab === 1
      ? 'product'
      : itemTypeTab === 2
        ? 'packaging_material'
        : undefined;

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

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Page Header */}
      <InventoryOverviewHeaderSection />

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
          />
        ) : (
          <WarehouseInventorySummaryPanel
            page={page}
            limit={limit}
            itemType={itemType}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Suspense>
    </Box>
  );
};

export default InventoryOverviewPage;
