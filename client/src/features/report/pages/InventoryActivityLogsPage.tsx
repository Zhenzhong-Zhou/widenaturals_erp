import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { usePaginatedInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import InventoryActivityLogsTable from '@features/report/components/InventoryActivityLogsTable';
import type { InventoryActivityLogEntry, InventoryActivityLogQueryParams } from '@features/report/state';

const InventoryActivityLogsPage: FC = () => {
  const {
    data,
    pagination,
    loading,
    error,
    fetchLogs,
  } = usePaginatedInventoryActivityLogs();
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filters, setFilters] = useState<Partial<InventoryActivityLogQueryParams>>({});
  
  const queryParams: InventoryActivityLogQueryParams = {
    page,
    limit,
    ...filters, // will include optional keys later
  };
  
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const handleExpandToggle = (row: InventoryActivityLogEntry) => {
    setExpandedRowId((prevId) => (prevId === row.id ? null : row.id));
  };
  
  const isRowExpanded = (row: InventoryActivityLogEntry) => row.id === expandedRowId;
  
  // Fetch on mount or when page/limit changes
  useEffect(() => {
    fetchLogs(queryParams); // server expects 1-based page
  }, [page, limit, filters, fetchLogs]);
  
  if (loading) return <Loading message="Loading activity logs..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  
  return (
    <>
      {Array.isArray(data) && data.length > 0 ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            boxShadow: 1,
          }}
        >
          {/* Section Header */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <CustomTypography variant="h6">
              Inventory Activity Logs
            </CustomTypography>
            
            <CustomButton variant="outlined" onClick={() => fetchLogs(queryParams)}>
              Refresh Logs
            </CustomButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Table */}
          <InventoryActivityLogsTable
            data={data}
            loading={loading}
            page={page - 1}
            totalPages={pagination?.totalPages ?? 1}
            totalRecords={pagination?.totalRecords ?? 0}
            rowsPerPage={limit}
            onPageChange={(newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1); // Reset to first page when changing rowsPerPage
            }}
            onExpandToggle={handleExpandToggle}
            isRowExpanded={isRowExpanded}
            expandedRowId={expandedRowId}
          />
        </Box>
      ) : (
        <NoDataFound message="No inventory activity logs available." />
      )}
    </>
  );
};

export default InventoryActivityLogsPage;
