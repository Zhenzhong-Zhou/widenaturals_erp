import { FC } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, Loading, ErrorDisplay, ErrorMessage, CustomTable, Typography } from '@components/index.ts';
import { PricingTypeDetail, PricingRecord, PricingTypePagination } from '../state/pricingTypeTypes';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

interface PricingTypeDetailsTableProps {
  pricingTypeDetails: PricingTypeDetail | null; // Added for pricing type metadata
  data: PricingRecord[]; // Updated to store pricing records
  pagination: PricingTypePagination;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  refetch: () => void;
}

const PricingTypeDetailsTable: FC<PricingTypeDetailsTableProps> = ({
                                                                     pricingTypeDetails,
                                                                     data,
                                                                     pagination,
                                                                     isLoading,
                                                                     error,
                                                                     page,
                                                                     limit,
                                                                     onPageChange,
                                                                     onLimitChange,
                                                                     refetch,
                                                                   }) => {
  if (isLoading) return <Loading message="Loading Pricing Type Details..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  
  
  console.log(data[0]?.created_by?.full_name || "No User");
  console.log(data[0]?.product?.name || "No Product");
  console.log(data[0]?.location?.name || "No Location");
  
  // Define columns for CustomTable
  const columns = [
    {
      id: 'product',
      label: 'Product Name',
      sortable: true,
      format: (row: any) => row?.name || 'No Product',
    },
    { id: 'price', label: 'Price', sortable: true },
   
    {
      id: 'valid_from',
      label: 'Valid From',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'valid_to',
      label: 'Valid To',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    
    {
      id: 'location',
      label: 'Location',
      sortable: true,
      format: (row: any) => row?.name || 'No Location',
    },
    { id: 'status', label: 'Status', sortable: true },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: any) =>  formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: any) =>  formatDateTime(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: true,
      format: (row: any) =>  row?.full_name || 'Unknown',
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      sortable: true,
      format: (row: any) => row?.full_name || 'Unknown',
    },
  ];
  
  return (
    <Box sx={{ padding: 2 }}>
      {/* Display Pricing Type Metadata */}
      {pricingTypeDetails && (
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="h4" gutterBottom>
            {pricingTypeDetails.pricing_type_name} - Price Type Details
          </Typography>
          <Typography variant="h6">Description: {pricingTypeDetails.pricing_type_description}</Typography>
          <Typography variant="body1">
            Status: {pricingTypeDetails.status} | Status Date: {formatDateTime(pricingTypeDetails.status_date)}
          </Typography>
          <Typography variant="body1">
            Created At: {formatDateTime(pricingTypeDetails.created_at)} | Last Updated: {formatDateTime(pricingTypeDetails.updated_at)}
          </Typography>
          <Typography variant="body1">
            Created By: {pricingTypeDetails.created_by.full_name} | Updated By: {pricingTypeDetails.updated_by.full_name}
          </Typography>
        </Box>
      )}
      
      {/* Pricing Records Table */}
      {data.length === 0 ? (
        <Typography variant="body1">No pricing records available for this pricing type.</Typography>
      ) : (
        <>
          <CustomTable
            columns={columns}
            data={data}
            rowsPerPageOptions={[5, 10, 25, 50]}
            initialRowsPerPage={limit}
            totalRecords={pagination.totalRecords}
            totalPages={pagination.totalPages}
            page={page - 1} // Adjust for zero-based indexing
            onPageChange={(newPage) => onPageChange(newPage + 1)} // Convert to one-based indexing
            onRowsPerPageChange={onLimitChange}
          />
          <Box sx={{ marginTop: 2 }}>
            <CustomButton onClick={refetch}>Refetch Data</CustomButton>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PricingTypeDetailsTable;
