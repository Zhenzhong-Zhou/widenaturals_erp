import { SyntheticEvent, useEffect, useState } from 'react';
import {
  useInventories,
  useInventorySummary,
} from '../../../hooks';
import InventoryTable from '../components/InventoryTable.tsx';
import { InventorySummaryTable } from '../index.ts';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
  const [tab, setTab] = useState(0); // 0 = Inventory Summary, 1 = Inventory List
  
  const {
    inventories,
    pagination,
    loading,
    error,
    refresh,
  } = useInventories(page, limit);
  console.log(inventories)
  const {
    inventorySummaryData,
    inventorySummaryPagination,
    inventorySummaryLoading,
    inventorySummaryError,
    fetchSummary,
    refreshSummary,
  } = useInventorySummary();
  
  // Fetch inventory summary only when that tab is active
  useEffect(() => {
    if (tab === 0) fetchSummary(page, limit);
    else fetchSummary(page, limit);
  }, [page, limit, tab]);
  
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
  
  if (tab === 0 && loading) return <Loading message="Loading Inventory..." />;
  if (tab === 1 && inventorySummaryLoading)
    return <Loading message="Loading Inventory Summary..." />;
  
  const renderError = (msg: string | null) => (
    <ErrorDisplay>
      <ErrorMessage message={msg || 'Unexpected error'} />
    </ErrorDisplay>
  );
  
  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="Inventory Summary" />
          <Tab label="Inventory List" />
        </Tabs>
      </Paper>
      
      {tab === 0 && (
        <>
          {inventorySummaryError && renderError(inventorySummaryError)}
          <InventorySummaryTable
            data={inventorySummaryData || []}
            page={inventorySummaryPagination.page - 1}
            rowsPerPage={inventorySummaryPagination.limit}
            totalRecords={inventorySummaryPagination.totalRecords}
            totalPages={inventorySummaryPagination.totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
          <CustomButton
            onClick={() => refreshSummary()}
            style={{ marginTop: '10px' }}
          >
            Refresh Summary
          </CustomButton>
        </>
      )}
      
      {tab === 1 && (
        <>
          {error && renderError(error)}
          <InventoryTable
            data={inventories || []}
            page={page - 1}
            rowsPerPage={limit}
            totalRecords={pagination.totalRecords}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
          <CustomButton onClick={() => refresh()} style={{ marginTop: '10px' }}>
            Refresh Inventory
          </CustomButton>
        </>
      )}
    </Box>
  );
};

export default InventoryPage;
