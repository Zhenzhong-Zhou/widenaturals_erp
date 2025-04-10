import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import WarehouseInventorySummaryCard from '@features/warehouse-inventory/components/WarehouseInventorySummaryCard';
import WarehouseInventoryTable from '@features/warehouse-inventory/components/WarehouseInventoryTable';
import CustomButton from '@components/common/CustomButton';
import { sanitizeWarehouseInventory } from '@utils/transformersUtlis';
import useWarehouseInventories from '@hooks/useWarehouseInventories';
import useWarehouseInventoriesSummary from '@hooks/useWarehouseInventoriesSummary';

const WarehouseInventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { inventories, pagination, loading, error, refresh } =
    useWarehouseInventories(page, limit);

  const {
    summaryLoading,
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
      <CustomTypography variant={'h4'}>No warehouse inventory found.</CustomTypography>
    );

  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography variant="h4">Warehouse Inventory</CustomTypography>
      </Paper>

      {/* Summary Card with Pagination */}
      {inventoriesSummary.length > 0 && (
        <WarehouseInventorySummaryCard
          isLoading={summaryLoading}
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
