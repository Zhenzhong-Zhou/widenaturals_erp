import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { CustomButton, Loading, ErrorDisplay, ErrorMessage } from '@components/index.ts';
import usePricingTypeDetails from '../../../hooks/usePricingTypeDetails';

const PricingTypeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <ErrorDisplay><ErrorMessage message={'Pricing Type ID is required.'}/></ErrorDisplay>;
  }
  
  const {
    data,
    pagination,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refetch,
  } = usePricingTypeDetails({
    pricingTypeId: id,
    initialPage: 1,
    initialLimit: 10,
  });
  console.log(data)
  if (isLoading) return <Loading message="Loading Pricing Type Details..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Pricing Type Details
      </Typography>
      
      {data.length === 0 ? (
        <Typography variant="body1">No data available for this pricing type.</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Location Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Valid From</TableCell>
                  <TableCell>Valid To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((detail) => (
                  <TableRow key={detail.pricing_id}>
                    <TableCell>{detail.product_name}</TableCell>
                    <TableCell>{detail.series}</TableCell>
                    <TableCell>{detail.brand}</TableCell>
                    <TableCell>{detail.category}</TableCell>
                    <TableCell>{detail.location_name}</TableCell>
                    <TableCell>{detail.location_type_name}</TableCell>
                    <TableCell>{detail.price}</TableCell>
                    <TableCell>{new Date(detail.valid_from).toLocaleDateString()}</TableCell>
                    <TableCell>{detail.valid_to ? new Date(detail.valid_to).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2">
                Page {pagination.page} of {pagination.totalPages} | Total Records: {pagination.totalRecords}
              </Typography>
            </Box>
            <Box>
              <CustomButton onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </CustomButton>
              <CustomButton onClick={() => setPage(page + 1)} disabled={page === pagination.totalPages}>
                Next
              </CustomButton>
            </Box>
          </Box>
        </>
      )}
      
      <Box sx={{ marginTop: 2 }}>
        <CustomButton onClick={refetch}>Refetch Data</CustomButton>
      </Box>
    </Box>
  );
};

export default PricingTypeDetailsPage;
