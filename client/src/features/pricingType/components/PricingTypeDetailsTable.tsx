import { FC } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable from '@components/common/CustomTable';
import CustomButton from '@components/common/CustomButton';
import {
  PricingTypeDetail,
  PricingRecord,
  PricingTypePagination,
} from '@features/pricingType';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

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
  if (isLoading)
    return (
      <Loading
        message={`Loading ${pricingTypeDetails?.pricing_type_name || ''} Pricing Type Details...`}
      />
    );
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  const transformedData = data.map((item) => ({
    ...item,

    // Flatten Product Details
    product_id: item.product?.id || null,
    product_name: item.product?.name || 'No Product',
    product_series: item.product?.series || 'No Series',
    product_brand: item.product?.brand || 'No Brand',
    product_category: item.product?.category || 'No Category',
    product_barcode: item.product?.barcode || 'No Barcode',
    product_market_region: item.product?.market_region || 'No Market Region',

    // Flatten Location Details
    location_id: item.location?.id || null,
    location_name: item.location?.name || 'No Location',
    location_type: item.location?.type || 'No Location Type',

    // Flatten Created By Details
    created_by_id: item.created_by?.id || null,
    created_by_name: item.created_by?.full_name || 'Unknown',

    // Flatten Updated By Details
    updated_by_id: item.updated_by?.id || null,
    updated_by_name: item.updated_by?.full_name || 'Unknown',

    // Dates and Status
    pricing: {
      // This ensures the entire pricing object is passed
      pricing_id: item.pricing_id || null,
      price: item.price || '0.00',
    },
    status: item.status || 'Unknown',
    status_date: item.status_date || null,
    valid_from: item.valid_from || null,
    valid_to: item.valid_to || null,
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  }));

  // Define columns for CustomTable
  const columns = [
    {
      id: 'pricing',
      label: 'Price',
      sortable: true,
      format: (row: any) => row.price || '0.00',
      renderCell: (row: any) => (
        <Link
          to={`/pricings/${row.pricing_id || 'unknown'}`}
          style={{ textDecoration: 'none', color: 'red' }}
        >
          {row.price || '0.00'}
        </Link>
      ),
    },
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
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value: string) => formatLabel(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },

    { id: 'product_name', label: 'Product Name', sortable: true },
    { id: 'product_brand', label: 'Brand', sortable: true },
    // { id: 'product_series', label: 'Series', sortable: true },
    // { id: 'product_category', label: 'Category', sortable: true },
    { id: 'product_barcode', label: 'Barcode', sortable: true },
    // { id: 'product_market_region', label: 'Market Region', sortable: true },

    { id: 'location_type', label: 'Location Type', sortable: true },
    { id: 'location_name', label: 'Location', sortable: true },

    {
      id: 'created_by_name',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'updated_by_name',
      label: 'Updated By',
      sortable: true,
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
  ];

  return (
    <Box sx={{ padding: 2 }}>
      {/* Display Pricing Type Metadata */}
      {pricingTypeDetails && (
        <Box sx={{ marginBottom: 2 }}>
          <CustomTypography variant="h4" gutterBottom>
            {pricingTypeDetails.pricing_type_name} - Price Type Details
          </CustomTypography>
          <CustomTypography variant="h6">
            Description: {pricingTypeDetails.pricing_type_description}
          </CustomTypography>
          <CustomTypography variant="body1">
            Status: {pricingTypeDetails.status} | Status Date:{' '}
            {formatDateTime(pricingTypeDetails.status_date)}
          </CustomTypography>
          <CustomTypography variant="body1">
            Created At: {formatDateTime(pricingTypeDetails.created_at)} | Last
            Updated: {formatDateTime(pricingTypeDetails.updated_at)}
          </CustomTypography>
          <CustomTypography variant="body1">
            Created By: {pricingTypeDetails.created_by.full_name} | Updated By:{' '}
            {pricingTypeDetails.updated_by.full_name}
          </CustomTypography>
        </Box>
      )}

      {/* Pricing Records Table */}
      {data.length === 0 ? (
        <CustomTypography variant="body1">
          No pricing records available for this pricing type.
        </CustomTypography>
      ) : (
        <>
          <CustomTable
            columns={columns}
            data={transformedData}
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
