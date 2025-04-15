import { lazy, Suspense, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import NoDataFound from '@components/common/NoDataFound';
import { sanitizeWarehouseInventory } from '@utils/transformersUtlis';
import useWarehouseInventories from '@hooks/useWarehouseInventories';
import useWarehouseInventoriesSummary from '@hooks/useWarehouseInventoriesSummary';

const WarehouseInventorySummaryCard = lazy(() => import('@features/warehouse-inventory/components/WarehouseInventorySummaryCard'));
const WarehouseInventoryTable = lazy(() => import('@features/warehouse-inventory/components/WarehouseInventoryTable'));

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
  
  const sanitizedInventories = useMemo(
    () => sanitizeWarehouseInventory(inventories || []),
    [inventories]
  );
  
  if (loading) return <Loading message={`Loading Warehouse Inventory...`} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!inventories || inventories.length === 0)
    return (
      <CustomTypography variant={'h4'}>
        No warehouse inventory found.
      </CustomTypography>
    );

  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography
          component="h1"
          variant="body1" // small visually, not LCP-heavy
          sx={{ fontSize: '1.125rem', fontWeight: 500, minHeight: '1.5rem' }}
        >
          Warehouse Inventory
        </CustomTypography>
      </Paper>

      {/* Summary Card with Pagination */}
      {summaryLoading || inventoriesSummary.length > 0 ? (
        <Suspense fallback={<Skeleton height={180} width="100%" />} >
          <WarehouseInventorySummaryCard
            isLoading={summaryLoading}
            inventoriesSummary={inventoriesSummary}
            summaryPage={summaryPage}
            totalPages={summaryPagination.totalPages}
            setSummaryPage={setSummaryPage}
            refreshSummary={refreshSummary}
          />
        </Suspense>
      ) : (<NoDataFound/>)}

      {/* Warehouse Inventory Table */}
      <Suspense fallback={<Skeleton height={180} width="100%" />} >
        <WarehouseInventoryTable
          data={sanitizedInventories}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
        />
      </Suspense>

      {/* Refresh Button */}
      <CustomButton onClick={refresh} sx={{ marginTop: 2 }}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehouseInventoryPage;
