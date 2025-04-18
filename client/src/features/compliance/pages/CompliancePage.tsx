import { useState } from 'react';
import Box from '@mui/material/Box';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import { useCompliances } from '../../../hooks';
import { ComplianceTable } from '../index.ts';

const CompliancePage = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  // const [sortBy, setSortBy] = useState<string>('created_at'); // Default valid field
  // const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC'); // Ensure correct type

  const { compliances, loading, error, pagination, refresh } = useCompliances(
    page,
    limit
    // sortBy, sortOrder
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Compliance Records
      </Typography>

      <CustomButton variant="contained" onClick={refresh} sx={{ mb: 2 }}>
        Refresh Data
      </CustomButton>

      {loading && <Loading message={'Loading All Compliances...'} />}
      {error && (
        <ErrorDisplay>
          <ErrorMessage message={error} />
        </ErrorDisplay>
      )}
      {!loading && !error && (
        <>
          {compliances.length > 0 ? (
            <ComplianceTable
              data={compliances}
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
          ) : (
            <Typography variant="h6" align="center" sx={{ mt: 2 }}>
              No compliance records found.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default CompliancePage;
