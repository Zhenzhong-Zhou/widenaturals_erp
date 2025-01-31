import { useEffect } from 'react';
import { usePricing } from '../../../hooks';
import { PricingTable } from '../index.ts';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading } from '@components/index.ts';
import Box from '@mui/material/Box';

const PricingPage = () => {
  const { pricingData, pagination, loading, error, fetchPricings } = usePricing();
  
  useEffect(() => {
    fetchPricings(pagination.page, pagination.limit);
  }, [pagination.page]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchPricings(newPage, pagination.limit);
    }
  };
  
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    fetchPricings(1, newRowsPerPage); // Reset to page 1 with new limit
  };
  
  if (loading) return <Loading message="Loading All Prices..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  console.log(pricingData)
  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ marginTop: 2 }}>
        <CustomButton onClick={() => handlePageChange(pagination.page)}>Refetch Data</CustomButton>
      </Box>
      <PricingTable
        data={pricingData}
        page={pagination.page}
        rowsPerPage={pagination.limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};

export default PricingPage;
