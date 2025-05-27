import { useCallback, useEffect, useState } from 'react';
import { groupBy } from 'lodash';
import useLocationInventory from '@hooks/useLocationInventory';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import StoreIcon from '@mui/icons-material/Store';
import CustomTypography from '@components/common/CustomTypography';
import LocationInventoryFilterPanel from '@features/locationInventory/components/LocationInventoryFilterPanel';
import LocationInventoryTable from '@features/locationInventory/components/LocationInventoryTable';
import type { FlatLocationInventoryRow, LocationInventoryQueryParams, LocationInventoryRecord } from '@features/locationInventory/state';
import LocationInventoryExpandedRow from '../components/LocationInventoryExpandedRow';

const LocationInventoryPage = () => {
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
  
  const groupedByLocation = groupBy(records, (record: LocationInventoryRecord) => record.location?.name || 'Unknown Location');
  
  const handleApplyFilters = (newFilters: LocationInventoryQueryParams) => {
    setFilters(newFilters);
    setPage(1); // reset to first page
  };
  
  const handleResetFilters = () => {
    setFilters({});
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
        <Stack direction="row" alignItems="center" spacing={1}>
          <StoreIcon fontSize="medium" color="primary" />
          <CustomTypography variant="h5" fontWeight={600}>
            All Location Inventory
          </CustomTypography>
        </Stack>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Filter Panel */}
        <LocationInventoryFilterPanel
          initialFilters={filters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
        
        {/* Table */}
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
      </Paper>
    </Box>
  );
};

export default LocationInventoryPage;
