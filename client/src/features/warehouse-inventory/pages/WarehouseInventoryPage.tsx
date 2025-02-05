import { useState } from 'react';
import { useWarehouseInventories } from '../../../hooks';
import WarehouseInventoryTable from '../components/WarehouseInventoryTable.tsx';
import { Box, Paper } from '@mui/material';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';

const WarehouseInventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const {
    inventories,
    pagination,
    loading,
    error,
    refresh
  } = useWarehouseInventories(page, limit);
  
  if (loading) return <Loading message={`Loading Warehouse Inventory...`}/>;
  if (error) return <ErrorDisplay><ErrorMessage message={error}/></ErrorDisplay>;
  if (!inventories) return <Typography variant={'h4'}>No warehouse inventory found.</Typography>;
  
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
        page={page - 1}
        rowsPerPage={limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => {setPage(newPage + 1);}}
        onRowsPerPageChange={(newLimit) => {setLimit(newLimit)}}
      />
      
      {/* Refresh Button */}
      <CustomButton onClick={() => refresh()} sx={{ marginTop: 2 }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehouseInventoryPage;
