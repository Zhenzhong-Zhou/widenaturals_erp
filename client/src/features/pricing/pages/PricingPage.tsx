import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import PricingTable from '@features/pricing/components/PricingTable';
import usePricing from '@hooks/usePricing';

const PricingPage = () => {
  const { pricingData, pagination, loading, error, fetchPricings } =
    usePricing();

  useEffect(() => {
    fetchPricings(pagination.page, pagination.limit);
  }, [pagination.page]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPricings(newPage, pagination.limit);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    fetchPricings(1, newRowsPerPage); // Reset to page 1 with new limit
  };

  if (loading) return <Loading message="Loading All Prices..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ marginTop: 2 }}>
        <CustomButton onClick={() => handlePageChange(pagination.page)}>
          Refetch Data
        </CustomButton>
      </Box>
      <PricingTable
        data={pricingData}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => handlePageChange(newPage + 1)}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};

export default PricingPage;
