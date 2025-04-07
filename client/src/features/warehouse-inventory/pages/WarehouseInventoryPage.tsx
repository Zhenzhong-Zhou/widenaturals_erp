import { useState } from 'react';
import {
  useWarehouseInventories,
  useWarehouseInventoriesSummary,
} from '../../../hooks';
import WarehouseInventoryTable from '../components/WarehouseInventoryTable.tsx';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import { WarehouseInventorySummaryCard } from '../index.ts';
import { sanitizeWarehouseInventory } from '@utils/transformersUtlis.ts';

const WarehouseInventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { inventories, pagination, loading, error, refresh } =
    useWarehouseInventories(page, limit);

  const {
    inventoriesSummary,
    summaryPagination,
    summaryPage,
    setSummaryPage,
    refreshSummary,
  } = useWarehouseInventoriesSummary(1, 3, '');
  
  const sanitizedInventories = sanitizeWarehouseInventory(inventories || []);
  
  if (loading) return <Loading message={`Loading Warehouse Inventory...`} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!inventories || inventories.length === 0)
    return (
      <Typography variant={'h4'}>No warehouse inventory found.</Typography>
    );

  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Inventory</Typography>
      </Paper>

      {/* Summary Card with Pagination */}
      {inventoriesSummary.length > 0 && (
        <WarehouseInventorySummaryCard
          inventoriesSummary={inventoriesSummary}
          summaryPage={summaryPage}
          totalPages={summaryPagination.totalPages}
          setSummaryPage={setSummaryPage}
          refreshSummary={refreshSummary}
        />
      )}

      {/* Warehouse Inventory Table */}
      <WarehouseInventoryTable
        data={sanitizedInventories}
        page={page - 1}
        rowsPerPage={limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
      />

      {/* Refresh Button */}
      <CustomButton onClick={refresh} sx={{ marginTop: 2 }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehouseInventoryPage;
