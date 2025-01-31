import { FC } from 'react';
import { PricingDetails } from '../state/pricingTypes.ts';
import { CustomTable, Typography } from '@components/index.ts';
import { Box, Paper } from '@mui/material';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';

interface PricingDetailsTableProps {
  pricing: PricingDetails;
  page: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const PricingDetailsTable: FC<PricingDetailsTableProps> = ({
                                                             pricing,
                                                             page,
                                                             totalRecords,
                                                             totalPages,
                                                             onPageChange,
                                                             onRowsPerPageChange,
                                                           }) => {
  // Define table columns
  const columns = [
    { id: 'product_name', label: 'Product Name', sortable: true },
    { id: 'barcode', label: 'Barcode', sortable: true },
    { id: 'brand', label: 'Brand', sortable: true },
    { id: 'category', label: 'Category', sortable: true },
    { id: 'market_region', label: 'Market Region', sortable: true },
  ];
  
  // Ensure `pricing` has product & location data before processing
  const formattedData = [
    {
      product_name: pricing.product?.name || 'N/A',
      barcode: pricing.product?.barcode || 'N/A',
      brand: pricing.product?.brand || 'N/A',
      category: pricing.product?.category || 'N/A',
      market_region: pricing.product?.market_region || 'N/A',
    }
  ];
  
  return (
    <Box>
      {/* General Pricing Info */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6">General Pricing Information</Typography>
        <Typography><strong>{pricing.price_type_name} Price:</strong> CA {formatCurrency(pricing.price)}</Typography>
        <Typography><strong>Location Type:</strong> {pricing.location.location_type.type_name}</Typography>
        <Typography><strong>Location:</strong> {pricing.location?.location_name}</Typography>
        <Typography><strong>Valid From:</strong> {formatDateTime(pricing.valid_from)}</Typography>
        <Typography><strong>Valid To:</strong> {pricing.valid_to ? formatDateTime(pricing.valid_to) : 'N/A'}</Typography>
        <Typography><strong>Status:</strong> {capitalizeFirstLetter(pricing.status_name)}</Typography>
        <Typography><strong>Status Date:</strong> {formatDateTime(pricing.status_date)}</Typography>
        <Typography><strong>Created At:</strong> {formatDateTime(pricing.created_at)}</Typography>
        <Typography><strong>Updated At:</strong> {formatDateTime(pricing.updated_at)}</Typography>
        <Typography><strong>Created By:</strong> {pricing.created_by}</Typography>
        <Typography><strong>Updated By:</strong> {pricing.updated_by}</Typography>
      </Paper>
      
      {/* Product & Location Table */}
      <CustomTable
        columns={columns}
        data={formattedData}
        page={page}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};

export default PricingDetailsTable;
