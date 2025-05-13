import { type SyntheticEvent, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
// import useInventories from '@hooks/useInventories';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary.ts';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

// Lazy load heavy tables
const InventorySummaryTable = lazy(() => import('@features/inventory/components/InventorySummaryTable'));
// const InventoryTable = lazy(() => import('@features/inventory/components/InventoryTable'));

const InventoryPage = () => {
  const [tab, setTab] = useState(0); // 0 = Summary, 1 = List
  const [itemTypeTab, setItemTypeTab] = useState(0); // 0 = all, 1 = product, 2 = material
  const [page, setPage] = useState(1);
  // const [limit, setLimit] = useState(10);
  
  
  const itemType = useMemo(() => {
    return itemTypeTab === 1 ? 'product' : itemTypeTab === 2 ? 'material' : 'all';
  }, [itemTypeTab]);
  
  const {
    data: inventorySummaryData,
    pagination: inventorySummaryPagination,
    loading: inventorySummaryLoading,
    error: inventorySummaryError,
    fetchWarehouseInventorySummary,
  } = useWarehouseInventoryItemSummary({ itemType });
  
  // On tab switch, optionally refresh (or you can remove this entirely if autoFetch is true)
  useEffect(() => {
    if (tab === 0) {
      fetchWarehouseInventorySummary({ page: 1, itemType });
    }
  }, [tab, itemType]);

  const handleTabChange = (_: SyntheticEvent, newValue: number) => setTab(newValue);
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    setPage(1);
  };
  
  // const handlePageChange = (newPage: number) => setPage(newPage + 1);
  // const handleRowsPerPageChange = (newLimit: number) => {
  //   setLimit(newLimit);
  //   setPage(1);
  // };
  
  const renderError = useMemo(
    () => (msg: string | null) => (
      <ErrorDisplay>
        <ErrorMessage message={msg || 'Unexpected error'} />
      </ErrorDisplay>
    ),
    []
  );
  
  const isLoading = tab === 0 ? inventorySummaryLoading : inventorySummaryLoading;
  
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
        {tab === 0 && (
          <Tabs
            value={itemTypeTab}
            onChange={handleItemTypeTabChange}
            sx={{ mt: 2 }}
            aria-label="Item Type Tabs"
          >
            <Tab label="All" />
            <Tab label="Products" />
            <Tab label="Materials" />
          </Tabs>
        )}
      </Paper>
      
      {/* Show Skeleton during top-level loading */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <>
          {tab === 0 && (
            <>
              {inventorySummaryError && renderError(inventorySummaryError)}
              {inventorySummaryData.length === 0 ? (
                <CustomTypography sx={{ mt: 2 }}>No inventory records found for this type.</CustomTypography>
              ) : (
                <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
                  <InventorySummaryTable
                    data={inventorySummaryData}
                    page={(inventorySummaryPagination?.page ?? 1) - 1}
                    rowsPerPage={inventorySummaryPagination?.limit ?? 20}
                    totalRecords={inventorySummaryPagination?.totalRecords ?? 0}
                    totalPages={inventorySummaryPagination?.totalPages ?? 1}
                    onPageChange={(newPage) => fetchWarehouseInventorySummary({ page: newPage + 1, itemType })}
                    onRowsPerPageChange={(newLimit) => fetchWarehouseInventorySummary({ page: 1, limit: newLimit, itemType })}
                  />
                </Suspense>
              )}
              <CustomButton onClick={() => fetchWarehouseInventorySummary({ page, itemType })} sx={{ mt: 2 }}>
                Refresh Summary
              </CustomButton>
            </>
          )}
          
          {tab === 1 && (
            <>
              {/*{error && renderError(error)}*/}
              {/*<Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>*/}
              {/*  <InventoryTable*/}
              {/*    data={inventories}*/}
              {/*    page={page - 1}*/}
              {/*    rowsPerPage={limit}*/}
              {/*    totalRecords={pagination.totalRecords}*/}
              {/*    totalPages={pagination.totalPages}*/}
              {/*    onPageChange={handlePageChange}*/}
              {/*    onRowsPerPageChange={handleRowsPerPageChange}*/}
              {/*  />*/}
              {/*</Suspense>*/}
              {/*<CustomButton onClick={refreshInventories} sx={{ mt: 2 }}>*/}
              {/*  Refresh Inventory*/}
              {/*</CustomButton>*/}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default InventoryPage;
