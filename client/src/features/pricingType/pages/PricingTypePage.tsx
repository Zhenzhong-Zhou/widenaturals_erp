import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import NoDataFound from '@components/common/NoDataFound';
import CustomTypography from '@components/common/CustomTypography';
import PricingTypeFilterPanel, {
  type PricingTypeFilterParams,
} from '@features/pricingType/components/PricingTypeFilterPanel';
import PricingTypeTable from '@features/pricingType/components/PricingTypeTable';
import CustomButton from '@components/common/CustomButton';
import usePricingTypes from '@hooks/usePricingTypes';

const PricingTypePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<PricingTypeFilterParams>({
    name: '',
    startDate: '',
    endDate: '',
  });

  const { data, pagination, isLoading, error, refetchAllPricingTypes } =
    usePricingTypes();

  // Fetch data when page/limit/filters change
  useEffect(() => {
    refetchAllPricingTypes({
      page,
      limit,
      ...filters,
    });
  }, [page, limit, filters]);

  const handleFilterChange = (updatedFilters: PricingTypeFilterParams) => {
    setFilters(updatedFilters);
    setPage(1); // reset page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      name: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

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
    return <NoDataFound message={'No pricing types found.'} />;
  }

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Page Title */}
      <CustomTypography variant="h5">Pricing Types</CustomTypography>

      {/* Divider */}
      <Divider sx={{ mb: 3 }} />

      {/* Filter Panel */}
      <Box sx={{ mb: 3 }}>
        <PricingTypeFilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </Box>

      {/* Table */}
      <PricingTypeTable
        data={data}
        totalPages={pagination?.totalPages ?? 1}
        totalRecords={pagination?.totalRecords ?? 0}
        rowsPerPage={limit}
        page={page - 1} // MUI pagination is zero-based
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      {/* Footer actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <CustomButton onClick={() => refetchAllPricingTypes({ page, limit })}>
          Refetch Data
        </CustomButton>
      </Box>
    </Box>
  );
};

export default PricingTypePage;
