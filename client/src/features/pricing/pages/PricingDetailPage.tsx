import { useParams } from 'react-router-dom';
import { usePricingDetail } from '../../../hooks';
import PricingDetailsTable from '../components/PricingDetailsTable';
import { Loading, ErrorMessage, Typography } from '@components/index.ts';
import Box from '@mui/material/Box';
import { formatCurrency } from '@utils/textUtils.ts';

const PricingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // Use the custom hook
  const {
    pricing,
    pagination,
    loading,
    error,
    fetchPricings,
  } = usePricingDetail(id, 1, 10);
  
  const handlePageChange = (newPage: number) => fetchPricings(newPage, pagination.limit);
  const handleRowsPerPageChange = (newLimit: number) => fetchPricings(1, newLimit);
  
  if (loading) return <Loading message="Loading Pricing Details..." />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <Box sx={{ padding: 3 }}>
      {pricing && (
        <Box>
          <Typography variant="h4" gutterBottom>
            {pricing.price_type_name} CA{formatCurrency(pricing.price)} - Pricing Details
          </Typography>
          <PricingDetailsTable
            pricing={pricing}
            page={pagination.page}
            totalRecords={pagination.totalRecords}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default PricingDetailPage;
