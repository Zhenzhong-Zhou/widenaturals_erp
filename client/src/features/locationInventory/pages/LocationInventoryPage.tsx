import { lazy, Suspense, type SyntheticEvent, useCallback, useEffect, useState } from 'react';
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
import type { FlatLocationInventoryRow, LocationInventoryQueryParams, LocationInventoryRecord } from '@features/locationInventory/state';
import LocationInventoryExpandedRow from '../components/LocationInventoryExpandedRow';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import SortControls from '@components/common/SortControls';
import { LOCATION_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import type { SortConfig } from '@shared-types/api';
import Skeleton from '@mui/material/Skeleton';
import ErrorDisplay from '@components/shared/ErrorDisplay.tsx';
import ErrorMessage from '@components/common/ErrorMessage.tsx';

const LocationInventoryTable = lazy(() => import('@features/locationInventory/components/LocationInventoryTable'));

const LocationInventoryPage = () => {
  const [itemTypeTab, setItemTypeTab] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: '', sortOrder: '' });
  const [filters, setFilters] = useState<LocationInventoryQueryParams>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    records,
    loading,
    pagination,
    error,
    fetchRecords,
  } = useLocationInventory();
  
  useEffect(() => {
    fetchRecords({ page, limit }, filters, sortConfig);
  }, [page, limit, filters, sortConfig]);
  
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
  
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  
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
          {/* Tabs + Title + Sort */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Tabs */}
            <ItemTypeTabs value={itemTypeTab} onChange={handleItemTypeTabChange} />
            
            {/* Right-side controls */}
            <Stack spacing={1}>
              <CustomTypography
                variant="body1"
                color="text.secondary"
                sx={{ ml: { sm: 'auto' } }}
              >
                Sort Options
              </CustomTypography>
              <SortControls
                sortBy={sortConfig.sortBy ?? ''}
                sortOrder={sortConfig.sortOrder ?? ''}
                onSortByChange={(value) =>
                  setSortConfig((prev) => ({ ...prev, sortBy: value }))
                }
                onSortOrderChange={(value) =>
                  setSortConfig((prev) => ({ ...prev, sortOrder: value }))
                }
                sortOptions={LOCATION_INVENTORY_SORT_OPTIONS}
              />
            </Stack>
          </Stack>
          
          <Divider sx={{ display: { xs: 'none', sm: 'block' } }} />
          
          {/* Filter Panel */}
          <LocationInventoryFilterPanel
            initialFilters={filters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            showActionsWhenAll={true}
          />
          
          {/* Table Section */}
          <Suspense fallback={<Skeleton height={180} width="100%" />} >
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
          </Suspense>
        </Stack>
        
        {/* Refresh Button */}
        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <CustomButton
            variant="outlined"
            onClick={() => fetchRecords({ page, limit }, filters, sortConfig)}
          >
            Refresh Inventory
          </CustomButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LocationInventoryPage;
