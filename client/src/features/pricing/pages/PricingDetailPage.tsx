import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import Typography from '@components/common/Typography';
import PricingDetailsTable from '@features/pricing/components/PricingDetailsTable';
import { formatCurrency } from '@utils/textUtils';
import usePricingDetail from '@hooks/usePricingDetail';

const PricingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  // Use the custom hook for fetching pricing details
  const { pricing, pagination, loading, error, fetchPricings } =
    usePricingDetail(id, 1, 10);

  // Pagination Handlers
  const handlePageChange = (newPage: number) =>
    fetchPricings(newPage, pagination.limit);
  const handleRowsPerPageChange = (newLimit: number) =>
    fetchPricings(1, newLimit);

  // Handle Loading & Error states
  if (loading) return <Loading message="Loading Pricing Details..." />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  return (
    <Box sx={{ padding: 3 }}>
      {pricing && (
        <>
          {/* Pricing Overview Section */}
          <Paper sx={{ padding: 2, marginBottom: 3 }}>
            <Typography variant="h4" gutterBottom>
              {pricing.price_type_name} - CA{formatCurrency(pricing.price)}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Valid From: {new Date(pricing.valid_from).toLocaleDateString()} →
              {pricing.valid_to
                ? new Date(pricing.valid_to).toLocaleDateString()
                : 'N/A'}
            </Typography>
          </Paper>

          {/* Pricing Details Table */}
          <PricingDetailsTable
            pricing={pricing}
            page={pagination.page}
            totalRecords={pagination.totalRecords}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
    </Box>
  );
};

export default PricingDetailPage;
