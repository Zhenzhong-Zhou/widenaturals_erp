import { useState } from 'react';
import { useInventories } from '../../../hooks';
import InventoryTable from '../components/InventoryTable.tsx';
import { Box, Paper } from '@mui/material';
import {
  Typography,
  CustomButton,
  Loading,
  ErrorDisplay,
  ErrorMessage,
} from '@components/index.ts';

const InventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { inventories, pagination, loading, error, refresh } = useInventories(
    page,
    limit
  ); // Pass page & limit to hook

  if (loading) return <Loading message={'Loading All Inventories...'} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!inventories)
    return <Typography variant={'h4'}>No inventory found.</Typography>;

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Inventory List</Typography>
      </Paper>

      {/* Pass controlled pagination props */}
      <InventoryTable
        data={inventories}
        page={page - 1}
        rowsPerPage={limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => {
          setPage(newPage + 1);
        }}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1); // Always reset to first page when changing rows per page
        }}
      />

      {/* Refresh Button */}
      <CustomButton onClick={() => refresh()} style={{ marginTop: '10px' }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default InventoryPage;
