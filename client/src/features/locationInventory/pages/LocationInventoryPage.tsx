import { type SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { groupBy } from 'lodash';
import useLocationInventory from '@hooks/useLocationInventory';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import StoreIcon from '@mui/icons-material/Store';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import ItemTypeTabs from '@features/inventoryShared/components/ItemTypeTabs';
import LocationInventoryFilterPanel from '@features/locationInventory/components/LocationInventoryFilterPanel';
import LocationInventoryTable from '@features/locationInventory/components/LocationInventoryTable';
import type { FlatLocationInventoryRow, LocationInventoryQueryParams, LocationInventoryRecord } from '@features/locationInventory/state';
import LocationInventoryExpandedRow from '../components/LocationInventoryExpandedRow';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';

const LocationInventoryPage = () => {
  const [itemTypeTab, setItemTypeTab] = useState(0);
  const [filters, setFilters] = useState<LocationInventoryQueryParams>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    records,
    loading,
    pagination,
    fetchRecords,
  } = useLocationInventory();
  
  useEffect(() => {
    fetchRecords({ page, limit }, filters);
  }, [page, limit, filters]);

  // Convert tab to batchType
  const batchType: ItemType | undefined =
    itemTypeTab === 1 ? 'product' :
      itemTypeTab === 2 ? 'packaging_material' :
        undefined;
  
  const groupedByLocation = groupBy(records, (record: LocationInventoryRecord) => record.location?.name || 'Unknown Location');
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    const newBatchType: LocationInventoryQueryParams['batchType'] =
      newValue === 1 ? 'product' : newValue === 2 ? 'packaging_material' : undefined;
    
    setFilters((prev) => ({
      ...prev,
      batchType: newBatchType,
    }));
    
    setPage(1);
  };
  
  const handleApplyFilters = (newFilters: LocationInventoryQueryParams) => {
    setFilters({ ...newFilters, batchType }); // always preserve tab batchType
    setPage(1); // reset to first page
  };
  
  const handleResetFilters = () => {
    setFilters(batchType ? { batchType } : {});
    setPage(1);
  };
  
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage + 1);
  }, []);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // reset to page 1
  }, []);
  
  const handleExpandToggle = (row: FlatLocationInventoryRow) => {
    setExpandedRowId(prev => (prev === row.id ? null : row.id));
  };
  
  const isRowExpanded = (row: FlatLocationInventoryRow) => expandedRowId === row.id;
  
  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        {/* Page Title */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <StoreIcon fontSize="medium" color="primary" />
          <CustomTypography variant="h5" fontWeight={600}>
            All Location Inventory
          </CustomTypography>
        </Stack>
        
        <Stack spacing={3}>
          {/* Item Type Tabs */}
          <ItemTypeTabs value={itemTypeTab} onChange={handleItemTypeTabChange} />
          
          <Divider />
          
          {/* Filter Panel */}
          <LocationInventoryFilterPanel
            initialFilters={filters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            showActionsWhenAll={true}
          />
          
          {/* Table Section */}
          <LocationInventoryTable
            isLoading={loading}
            groupedData={groupedByLocation}
            page={page - 1}
            rowsPerPage={limit}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            expandedRowId={expandedRowId}
            onExpandToggle={handleExpandToggle}
            isRowExpanded={isRowExpanded}
            expandedContent={(row) => <LocationInventoryExpandedRow record={row.originalRecord} />}
          />
        </Stack>
        
        {/* Refresh Button */}
        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <CustomButton
            variant="outlined"
            onClick={() => fetchRecords({ page, limit }, filters)}
          >
            Refresh Inventory
          </CustomButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LocationInventoryPage;
