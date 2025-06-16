import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { usePaginatedInventoryActivityLogs } from '@hooks/useInventoryActivityLogs';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import InventoryActivityLogsTable from '@features/report/components/InventoryActivityLogsTable';
import CustomTypography from '@components/common/CustomTypography';

const InventoryActivityLogsPage: FC = () => {
  const {
    data,
    pagination,
    loading,
    error,
    fetchLogs,
  } = usePaginatedInventoryActivityLogs();
  
  const [page, setPage] = useState(0); // zero-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Fetch on mount or when page/limit changes
  useEffect(() => {
    fetchLogs({ page: page + 1, limit: rowsPerPage }); // server expects 1-based page
  }, [page, rowsPerPage, fetchLogs]);
  
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
        <InventoryActivityLogsTable
          data={data}
          loading={loading}
          page={page}
          totalRecords={pagination?.totalRecords ?? 0}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit) => {
            setRowsPerPage(newLimit);
            setPage(0); // Reset to first page when changing rowsPerPage
          }}
        />
      ) : (
        <CustomTypography
          variant="body1"
          sx={{ textAlign: 'center', padding: 2 }}
        >
          No inventory activity logs available.
        </CustomTypography>
      )}
    </>
  );
};

export default InventoryActivityLogsPage;
