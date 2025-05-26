import { useCallback, useEffect, useState } from 'react';
import { groupBy } from 'lodash';
import useLocationInventory from '@hooks/useLocationInventory';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import StoreIcon from '@mui/icons-material/Store';
import CustomTypography from '@components/common/CustomTypography';
import LocationInventoryTable from '@features/locationInventory/components/LocationInventoryTable';
import type { LocationInventoryRecord } from '@features/locationInventory/state';

const LocationInventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  
  const {
    records,
    loading,
    pagination,
    fetchRecords,
  } = useLocationInventory();
  
  useEffect(() => {
    fetchRecords({ page, limit }, {});
  }, [page, limit, fetchRecords]);
  
  const groupedByLocation = groupBy(records, (record: LocationInventoryRecord) => record.location?.name || 'Unknown Location');
  
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage + 1);
  }, []);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // reset to page 1
  }, []);
  
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
        
        <LocationInventoryTable
          isLoading={loading}
          groupedData={groupedByLocation}
          page={page - 1}
          rowsPerPage={limit}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default LocationInventoryPage;
