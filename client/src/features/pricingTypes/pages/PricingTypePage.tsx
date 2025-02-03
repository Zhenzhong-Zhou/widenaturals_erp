import { usePricingTypes } from '../../../hooks';
import { PricingTypeTable } from '../index.ts';
import Box from '@mui/material/Box';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading } from '@components/index.ts';

const PricingTypePage = () => {
  const {
    data,
    totalRecords,
    totalPages,
    page,
    limit,
    isLoading,
    error,
    setPage,
    setLimit,
    refetch,
  } = usePricingTypes({ initialPage: 1, initialLimit: 10 });
  
  if (isLoading) return <Loading message="Loading All Pricing Types..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 2 }}>
      <PricingTypeTable
        data={data}
        totalPages={totalPages}
        totalRecords={totalRecords}
        rowsPerPage={limit}
        page={page - 1} // Material-UI uses zero-based indexing for pages
        onPageChange={(newPage) => setPage(newPage + 1)} // Convert back to one-based indexing
        onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
      />
      <Box sx={{ marginTop: 2 }}>
        <CustomButton onClick={refetch}>Refetch Data</CustomButton>
      </Box>
    </Box>
  );
};

export default PricingTypePage;
