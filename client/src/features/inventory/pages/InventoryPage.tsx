import { type SyntheticEvent, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import useInventories from '@hooks/useInventories';
import useSkuWarehouseInventorySummary from '@hooks/useSkuWarehouseInventorySummary';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

// Lazy load heavy tables
const InventorySummaryTable = lazy(() => import('@features/inventory/components/InventorySummaryTable'));
const InventoryTable = lazy(() => import('@features/inventory/components/InventoryTable'));

const InventoryPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tab, setTab] = useState(0);
  
  const { inventories, pagination, loading, error, refresh: refreshInventories } = useInventories(page, limit);
  
  const {
    data: inventorySummaryData,
    pagination: inventorySummaryPagination,
    loading: inventorySummaryLoading,
    error: inventorySummaryError,
    refresh: refreshSkuSummary,
  } = useSkuWarehouseInventorySummary();
  
  // On tab switch, optionally refresh (or you can remove this entirely if autoFetch is true)
  useEffect(() => {
    if (tab === 0 && inventorySummaryData.length === 0 && !inventorySummaryLoading) {
      refreshSkuSummary();
    }
  }, [tab]);
  
  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1);
  };
  
  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };
  
  const renderError = useMemo(
    () => (msg: string | null) => (
      <ErrorDisplay>
        <ErrorMessage message={msg || 'Unexpected error'} />
      </ErrorDisplay>
    ),
    []
  );
  
  const isLoading = tab === 0 ? inventorySummaryLoading : loading;
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <CustomTypography sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          Inventory Management
        </CustomTypography>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Inventory Summary" />
          <Tab label="Inventory List" />
        </Tabs>
      </Paper>
      
      {/* Show Skeleton during top-level loading */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={60}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
      ) : (
        <>
          {tab === 0 && (
            <>
              {inventorySummaryError && renderError(inventorySummaryError)}
              <Suspense
                fallback={
                  <Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />
                }
              >
                <InventorySummaryTable
                  data={inventorySummaryData || []}
                  page={(inventorySummaryPagination?.page ?? 1) - 1}
                  rowsPerPage={inventorySummaryPagination?.limit ?? 10}
                  totalRecords={inventorySummaryPagination?.totalRecords ?? 0}
                  totalPages={inventorySummaryPagination?.totalPages ?? 1}
                  onPageChange={(newPage) => refreshSkuSummary({ page: newPage + 1 })}
                  onRowsPerPageChange={(newLimit) => refreshSkuSummary({ page: 1, limit: newLimit })}
                />
              </Suspense>
              <CustomButton onClick={() => refreshSkuSummary()} sx={{ mt: 2 }}>
                Refresh Summary
              </CustomButton>
            </>
          )}
          
          {tab === 1 && (
            <>
              {error && renderError(error)}
              <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
                <InventoryTable
                  data={inventories || []}
                  page={page - 1}
                  rowsPerPage={limit}
                  totalRecords={pagination.totalRecords}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              </Suspense>
              <CustomButton onClick={refreshInventories} sx={{ mt: 2 }}>
                Refresh Inventory
              </CustomButton>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default InventoryPage;
