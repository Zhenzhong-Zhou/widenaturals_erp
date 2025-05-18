import { type SyntheticEvent, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Skeleton from '@mui/material/Skeleton';
import useLocationInventorySummary from '@hooks/useLocationInventorySummary';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

// Lazy load heavy tables
const InventorySummaryTable = lazy(() => import('@features/locationInventory/components/SkuInventorySummaryTable'));
const LocationInventorySummaryTable = lazy(() => import('@features/locationInventory/components/LocationInventorySummaryTable'));

const LocationInventoryPage = () => {
  const [tab, setTab] = useState(0); // 0 = Summaries, 1 = List
  const [itemTypeTab, setItemTypeTab] = useState(0); // 0 = all, 1 = product, 2 = material
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const itemType = useMemo(() => {
    return itemTypeTab === 1 ? 'product' : itemTypeTab === 2 ? 'packing_material' : 'all';
  }, [itemTypeTab]);
  
  const {
    data: locationInventorySummaryData,
    pagination: locationInventorySummaryPagination,
    loading: locationInventorySummaryLoading,
    error: locationInventorySummaryError,
    fetchData: fetchLocationInventorySummary,
  } = useLocationInventorySummary();
  
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
      fetchWarehouseInventorySummary({ page: 1, limit, itemType });
    } else if (tab === 1) {
      fetchLocationInventorySummary({ page: 1, limit });
    }
  }, [tab, itemType]);
  
  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setPage(1);
  };
  
  const handleItemTypeTabChange = (_: SyntheticEvent, newValue: number) => {
    setItemTypeTab(newValue);
    setPage(1);
  };
  
  const handlePageChange = (newPage: number) => {
    const nextPage = newPage + 1;
    setPage(nextPage);
    if (tab === 0) {
      fetchWarehouseInventorySummary({ page: nextPage, limit, itemType });
    } else {
      fetchLocationInventorySummary({ page: nextPage, limit });
    }
  };
  
  const handleRowsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    if (tab === 0) {
      fetchWarehouseInventorySummary({ page: 1, limit: newLimit, itemType });
    } else {
      fetchLocationInventorySummary({ page: 1, limit: newLimit });
    }
  };
  
  const renderError = useMemo(
    () => (msg: string | null) => (
      <ErrorDisplay>
        <ErrorMessage message={msg || 'Unexpected error'} />
      </ErrorDisplay>
    ),
    []
  );
  
  const isLoading = tab === 0 ? inventorySummaryLoading : locationInventorySummaryLoading;
  
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
          {tab === 0 ? (
            <>
              {inventorySummaryError && renderError(inventorySummaryError)}
              {inventorySummaryData.length === 0 ? (
                <CustomTypography sx={{ mt: 2 }}>No inventory records found for this type.</CustomTypography>
              ) : (
                <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
                  <InventorySummaryTable
                    data={inventorySummaryData}
                    page={page - 1}
                    rowsPerPage={limit}
                    totalRecords={inventorySummaryPagination?.totalRecords ?? 0}
                    totalPages={inventorySummaryPagination?.totalPages ?? 1}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                  />
                </Suspense>
              )}
              <CustomButton
                onClick={() => fetchWarehouseInventorySummary({ page, limit, itemType })}
                sx={{ mt: 2 }}
              >
                Refresh Summary
              </CustomButton>
            </>
          ) : (
            <>
              {locationInventorySummaryError && renderError(locationInventorySummaryError)}
              {locationInventorySummaryData.length === 0 ? (
                <CustomTypography sx={{ mt: 2 }}>No location inventory data available.</CustomTypography>
              ) : (
                <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
                  <LocationInventorySummaryTable
                    data={locationInventorySummaryData}
                    page={page - 1}
                    rowsPerPage={limit}
                    totalRecords={locationInventorySummaryPagination?.totalRecords ?? 0}
                    totalPages={locationInventorySummaryPagination?.totalPages ?? 1}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                  />
                </Suspense>
              )}
              <CustomButton
                onClick={() => fetchLocationInventorySummary({ page, limit })}
                sx={{ mt: 2 }}
              >
                Refresh Inventory
              </CustomButton>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default LocationInventoryPage;
