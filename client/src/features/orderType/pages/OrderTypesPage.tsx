import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import useOrderTypes from '@hooks/useOrderTypes';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import Typography from '@components/common/Typography';
import CustomButton from '@components/common/CustomButton';
import OrderTypesTable from '@features/orderType/components/OrderTypesTable';

const OrderTypesPage: FC = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  // const [sortBy, setSortBy] = useState<string>('created_at'); // Default valid field
  // const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC'); // Ensure correct type
  const { orderTypes, pagination, isLoading, error, refresh } = useOrderTypes(
    page,
    limit
    // sortBy, sortOrder
  );

  if (isLoading) return <Loading message="Loading Order Types..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Order Types
      </Typography>

      <CustomButton variant="contained" onClick={refresh} sx={{ mb: 2 }}>
        Refresh Data
      </CustomButton>

      {!isLoading && !error && (
        <>
          {orderTypes.length > 0 ? (
            <OrderTypesTable
              data={orderTypes}
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
              No order types found.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default OrderTypesPage;
