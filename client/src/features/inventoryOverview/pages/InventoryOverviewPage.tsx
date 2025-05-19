import { useState, useEffect, type SyntheticEvent, lazy } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CustomTypography from '@components/common/CustomTypography';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';

// Lazy loaded panels
const LocationInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/LocationInventorySummaryPanel'));
const WarehouseInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/WarehouseInventorySummaryPanel'));

const InventoryOverviewPage = () => {
  const [tab, setTab] = useState(0); // 0 = Location, 1 = Warehouse
  const [itemTypeTab, setItemTypeTab] = useState(0); // 0 = all, 1 = product, 2 = material
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const itemType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' : itemTypeTab === 2 ? 'packaging_material' : undefined;
  
  useEffect(() => {
    // Reset page on type/tab change
    setPage(1);
  }, [tab, itemTypeTab]);
  
  const handleTabChange = (_: SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1); // Component uses 0-based index
  };
  
  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };
  
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
    </Box>
  );
};

export default InventoryOverviewPage;
