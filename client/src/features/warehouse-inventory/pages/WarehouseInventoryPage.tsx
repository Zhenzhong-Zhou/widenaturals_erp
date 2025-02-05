import { useEffect, useState } from 'react';
import { useWarehouseInventories } from '../../../hooks';
import WarehouseInventoryTable from '../components/WarehouseInventoryTable.tsx';
import { Box, Paper, Typography } from '@mui/material';
import { CustomButton } from '@components/index.ts';

const WarehouseInventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Initial limit: 10 items per page
  
  const {
    inventories,
    pagination,
    loading,
    error,
    refresh,
  } = useWarehouseInventories(page, limit); // Hook with controlled pagination
  
  useEffect(() => {
    refresh();
  }, [refresh, page, limit]);
  
  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Inventory</Typography>
      </Paper>
      
      {/* Loading & Error Handling */}
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      {/* Warehouse Inventory Table */}
      <WarehouseInventoryTable
        data={inventories}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={setLimit}
      />
      
      {/* Refresh Button */}
      <CustomButton onClick={() => refresh()} sx={{ marginTop: 2 }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehouseInventoryPage;
