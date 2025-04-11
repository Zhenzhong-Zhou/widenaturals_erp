import type { FC } from 'react';
import type { PricingDetails } from '@features/pricing';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable from '@components/common/CustomTable';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel, formatCurrency } from '@utils/textUtils';

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
  // Ensure pricing object contains valid data
  const products = pricing.products || [];
  const locations = pricing.locations || [];

  // Define columns for products table
  const productColumns = [
    { id: 'name', label: 'Product Name', sortable: true },
    { id: 'barcode', label: 'Barcode', sortable: true },
    { id: 'brand', label: 'Brand', sortable: true },
    { id: 'category', label: 'Category', sortable: true },
    { id: 'market_region', label: 'Market Region', sortable: true },
  ];

  // Define columns for locations table
  const locationColumns = [
    { id: 'location_name', label: 'Location', sortable: true },
    {
      id: 'location_type',
      label: 'Location Type',
      sortable: false,
      format: (value: any) => value?.type_name ?? 'Unknown',
    },
  ];

  return (
    <Box>
      {/* General Pricing Info */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography variant="h6">General Pricing Information</CustomTypography>
        <CustomTypography>
          <strong>{pricing.price_type_name} Price:</strong> CA{' '}
          {formatCurrency(pricing.price)}
        </CustomTypography>
        <CustomTypography>
          <strong>Valid From:</strong> {formatDateTime(pricing.valid_from)}
        </CustomTypography>
        <CustomTypography>
          <strong>Valid To:</strong>{' '}
          {pricing.valid_to ? formatDateTime(pricing.valid_to) : 'N/A'}
        </CustomTypography>
        <CustomTypography>
          <strong>Status:</strong> {formatLabel(pricing.status_name)}
        </CustomTypography>
        <CustomTypography>
          <strong>Status Date:</strong> {formatDateTime(pricing.status_date)}
        </CustomTypography>
        <CustomTypography>
          <strong>Created At:</strong> {formatDateTime(pricing.created_at)}
        </CustomTypography>
        <CustomTypography>
          <strong>Updated At:</strong> {formatDateTime(pricing.updated_at)}
        </CustomTypography>
        <CustomTypography>
          <strong>Created By:</strong> {pricing.created_by}
        </CustomTypography>
        <CustomTypography>
          <strong>Updated By:</strong> {pricing.updated_by}
        </CustomTypography>
      </Paper>

      {/* Products Table */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography variant="h6">Linked Products</CustomTypography>
        <CustomTable
          columns={productColumns}
          data={products}
          page={page}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Paper>

      {/* Locations Table */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <CustomTypography variant="h6">Linked Locations</CustomTypography>
        <CustomTable
          columns={locationColumns}
          data={locations}
          page={page}
          totalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default PricingDetailsTable;
