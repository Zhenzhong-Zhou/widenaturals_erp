import { useState, type SyntheticEvent, lazy, useCallback, startTransition, Suspense, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import CustomTypography from '@components/common/CustomTypography';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import useLocationInventoryKpiSummary from '@hooks/useLocationInventoryKpiSummary';
import KpiSummaryCards from '@features/locationInventory/components/KpiSummaryCards';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Divider from '@mui/material/Divider';

// Lazy loaded panels
const LocationInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/LocationInventorySummaryPanel'));
const WarehouseInventorySummaryPanel = lazy(() => import('@features/inventoryOverview/components/WarehouseInventorySummaryPanel'));

const InventoryOverviewPage = () => {
  const [selectedType, setSelectedType] = useState<'product' | 'packaging_material' | 'total'>('total');
  const [tab, setTab] = useState(0); // 0 = Location, 1 = Warehouse
  const [locationState, setLocationState] = useState({ itemTypeTab: 0, page: 1, limit: 20 });
  const [warehouseState, setWarehouseState] = useState({ itemTypeTab: 0, page: 1, limit: 20 });
  
  const { itemTypeTab, page, limit } = tab === 0 ? locationState : warehouseState;
  
  const itemType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' : itemTypeTab === 2 ? 'packaging_material' : undefined;
  
  const {
    data,
    loading,
    error,
    fetchKpiSummary,
  } = useLocationInventoryKpiSummary();
  
  useEffect(() => {
    fetchKpiSummary();
  }, []);
  
  const handleTypeChange = (_: unknown, newType: typeof selectedType | null) => {
    if (newType) setSelectedType(newType);
  };
  
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
    <Box sx={{ px: 4, py: 3 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <CustomTypography variant="h4" fontWeight={700}>
            Inventory Overview
          </CustomTypography>
          <CustomTypography variant="body1" color="text.secondary">
            Track key inventory metrics and summaries.
          </CustomTypography>
        </Box>
        <ToggleButtonGroup
          value={selectedType}
          exclusive
          onChange={handleTypeChange}
          size="small"
          color="primary"
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            height: 40,
          }}
        >
          <ToggleButton value="total">Total</ToggleButton>
          <ToggleButton value="product">Product</ToggleButton>
          <ToggleButton value="packaging_material">Packaging</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* KPI Summary */}
      <Box mb={4}>
        <CustomTypography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Inventory KPI Summary
        </CustomTypography>
        <KpiSummaryCards
          data={data}
          error={error}
          loading={loading}
          visibleTypes={[selectedType]}
          fetchKpiSummary={fetchKpiSummary}
        />
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
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
            <ItemTypeTabs value={itemTypeTab} onChange={handleItemTypeTabChange} />
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
