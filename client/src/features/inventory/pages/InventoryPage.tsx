import { useEffect } from 'react';
import { useInventories } from '../../../hooks';
import InventoryTable from '../components/InventoryTable.tsx';
import { Box, Paper } from '@mui/material';
import { Typography, CustomButton } from '@components/index.ts';

const InventoryPage = () => {
  const {
    inventories,
    pagination,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refresh,
  } = useInventories(1, 10); // Initial page & limit
  
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Inventory List</Typography>
      </Paper>
      
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      {/* Inventory Table */}
      <InventoryTable
        data={inventories}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
      />
      
      {/* Refresh Button */}
      <CustomButton onClick={refresh} style={{ marginTop: '10px' }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default InventoryPage;
