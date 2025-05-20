import { useState, type SyntheticEvent, lazy, useCallback, startTransition, Suspense } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';

// Lazy loaded panels
const LocationInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/LocationInventorySummaryPanel'));
const WarehouseInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/WarehouseInventorySummaryPanel'));

const InventoryOverviewPage = () => {
  const [tab, setTab] = useState(0); // 0 = Location, 1 = Warehouse
  const [locationState, setLocationState] = useState({ itemTypeTab: 0, page: 1, limit: 20 });
  const [warehouseState, setWarehouseState] = useState({ itemTypeTab: 0, page: 1, limit: 20 });
  
  const { itemTypeTab, page, limit } = tab === 0 ? locationState : warehouseState;
  
  const itemType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' : itemTypeTab === 2 ? 'packaging_material' : undefined;
  
  const handleTabChange = (_: SyntheticEvent, newTab: number) => {
    startTransition(() => {
      setTab(newTab);
    });
  };
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    startTransition(() => {
      if (tab === 0) {
        setLocationState((prev) => ({ ...prev, itemTypeTab: newValue, page: 1 }));
      } else {
        setWarehouseState((prev) => ({ ...prev, itemTypeTab: newValue, page: 1 }));
      }
    });
  };
  
  const handlePageChange = useCallback((newPage: number) => {
    if (tab === 0) {
      setLocationState((prev) => ({ ...prev, page: newPage + 1 }));
    } else {
      setWarehouseState((prev) => ({ ...prev, page: newPage + 1 }));
    }
  }, [tab]);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    if (tab === 0) {
      setLocationState((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    } else {
      setWarehouseState((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    }
  }, [tab]);
  
  return (
    <Box sx={{ p: 3 }}>
      <CustomTypography variant={'h5'}>
        Inventory Overview
      </CustomTypography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <CustomTypography sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          Inventory Management
        </CustomTypography>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Location Inventory Summary" />
          <Tab label="Warehouse Inventory Summary" />
        </Tabs>
        {(tab === 0 || tab === 1) && (
          <ItemTypeTabs value={itemTypeTab} onChange={handleItemTypeTabChange} />
        )}
      </Paper>
      
      <Suspense
        fallback={
          <Skeleton
            height={400}
            variant="rectangular"
            sx={{ borderRadius: 1, mb: 2 }}
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
