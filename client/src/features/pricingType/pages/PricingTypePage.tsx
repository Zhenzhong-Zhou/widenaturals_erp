import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import PricingTypeTable from '@features/pricingType/components/PricingTypeTable';
import CustomButton from '@components/common/CustomButton';
import usePricingTypes from '@hooks/usePricingTypes';

const PricingTypePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const {
    data,
    pagination,
    isLoading,
    error,
    refetchAllPricingTypes,
  } = usePricingTypes();
  
  useEffect(() => {
    refetchAllPricingTypes({ page, limit });
  }, [page, limit]);
  
  if (isLoading) {
    return <Loading message="Loading All Pricing Types..." />;
  }
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  if (!data) {
    return <NoDataFound message={"No pricing types found."} />;
  }
  
  return (
    <Box sx={{ padding: 2 }}>
      <PricingTypeTable
        data={data}
        totalPages={pagination?.totalPages ?? 1}
        totalRecords={pagination?.totalRecords ?? 0}
        rowsPerPage={limit}
        page={page - 1} // zero-based for MUI Table
        onPageChange={(newPage) => setPage(newPage + 1)} // one-based for API
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1); // reset to first page on rows change
        }}
      />
      <Box sx={{ marginTop: 2 }}>
        <CustomButton onClick={() => refetchAllPricingTypes({ page, limit })}>
          Refetch Data
        </CustomButton>
      </Box>
    </Box>
  );
};

export default PricingTypePage;
