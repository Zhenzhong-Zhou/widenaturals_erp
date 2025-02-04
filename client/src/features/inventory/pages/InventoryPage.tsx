import { useEffect, useState } from 'react';
import { useInventories } from '../../../hooks';
import InventoryTable from '../components/InventoryTable.tsx';
import { Box, Paper } from '@mui/material';
import { Typography, CustomButton } from '@components/index.ts';

const InventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const {
    inventories,
    pagination,
    loading,
    error,
    refresh,
  } = useInventories(page, limit); // Pass page & limit to hook
  
  useEffect(() => {
    refresh();
  }, [refresh, page, limit]);
  
  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Inventory List</Typography>
      </Paper>
      
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      {/* Pass controlled pagination props */}
      <InventoryTable
        data={inventories}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={setLimit}
      />
      
      {/* Refresh Button */}
      <CustomButton onClick={() => refresh()} style={{ marginTop: '10px' }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default InventoryPage;
