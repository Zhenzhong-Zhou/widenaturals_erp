import { type FC, useState, useCallback } from 'react';
import type { PricingDetail } from '../state';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

interface GroupedPricingDetailsTableProps {
  groupedData: Record<string, PricingDetail[]>;
}

type FlattenedPricingRow = {
  sku: string;
  barcode: string;
  productName: string;
  brand: string;
  locationName: string;
  price: string;
  validFrom: string;
  validTo: string | null;
  status: {
    id: string;
    name: string;
  };
};

const GroupedPricingDetailsTable: FC<GroupedPricingDetailsTableProps> = ({
  groupedData,
}) => {
  const columns: Column<FlattenedPricingRow>[] = [
    { id: 'sku', label: 'SKU', sortable: true },
    { id: 'barcode', label: 'Barcode', sortable: true },
    { id: 'productName', label: 'Product Name', sortable: true },
    { id: 'brand', label: 'Brand', sortable: true },
    { id: 'sizeLabel', label: 'Size Label', sortable: true },
    { id: 'countryCode', label: 'Country Code', sortable: true },
    { id: 'locationName', label: 'Location', sortable: true },
    {
      id: 'price',
      label: 'Price (CA$)',
      sortable: true,
      format: (value) =>
        typeof value === 'string' ? formatCurrency(value) : '—',
    },
    {
      id: 'validFrom',
      label: 'Valid From',
      sortable: true,
      format: (val) => formatDateTime(val as string | Date),
    },
    {
      id: 'validTo',
      label: 'Valid To',
      sortable: true,
      format: (val) => formatDateTime(val as string | Date),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) =>
        value && typeof value === 'object' && 'name' in value
          ? formatLabel(value.name)
          : '—',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (val) => formatDateTime(val as string | Date),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (val) => formatDateTime(val as string | Date),
    },
    {
      id: 'updatedBy',
      label: 'Updated By',
      sortable: true,
    },
  ];

  // Track pagination state for each group
  const [paginationState, setPaginationState] = useState<
    Record<string, { page: number; limit: number }>
  >({});

  const handlePageChange = useCallback((groupKey: string, newPage: number) => {
    setPaginationState((prev) => {
      const current = prev[groupKey] ?? { page: 1, limit: 5 }; // default fallback
      return {
        ...prev,
        [groupKey]: {
          ...current,
          page: newPage,
        },
      };
    });
  }, []);

  const handleRowsPerPageChange = useCallback(
    (groupKey: string, newLimit: number) => {
      setPaginationState((prev) => ({
        ...prev,
        [groupKey]: {
          page: 1,
          limit: newLimit,
        },
      }));
    },
    []
  );

  return (
    <Box>
      {Object.entries(groupedData ?? {}).map(([groupKey, records]) => {
        const record = records[0];

        const pagination = {
          page: paginationState[groupKey]?.page ?? 1,
          limit: paginationState[groupKey]?.limit ?? 5,
        };
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;

        const slicedRecords = records.slice(startIndex, endIndex);
        const tableData = slicedRecords.map((item) => ({
          sku: item.sku.sku,
          sizeLabel: item.sku.sizeLabel,
          barcode: item.sku.barcode,
          countryCode: item.sku.countryCode,
          productName: item.product.productName,
          brand: item.product.brand,
          locationName: item.pricing.locationName,
          price: item.pricing.price,
          validFrom: item.pricing.validFrom,
          validTo: item.pricing.validTo,
          status: item.pricing.status,
          createdAt: item.pricing.createdAt,
          createdBy: item.pricing.createdBy.fullname,
          updatedAt: item.pricing.updatedAt,
          updatedBy: item.pricing.updatedBy.fullname,
          productCount: item.productCount,
        }));

        return (
          <Paper key={groupKey} sx={{ padding: 2, marginBottom: 4 }}>
            <CustomTypography variant="h6" gutterBottom>
              {groupKey}
            </CustomTypography>
            {record && (
              <CustomTypography variant="body2" sx={{ mb: 2 }}>
                Valid From: {formatDateTime(record.pricing.validFrom)} →{' '}
                {record.pricing.validTo
                  ? formatDateTime(record.pricing.validTo)
                  : 'N/A'}
              </CustomTypography>
            )}

            <CustomTable
              rowsPerPageId={`rows-per-page-${groupKey}`}
              columns={columns}
              data={tableData}
              page={(pagination.page ?? 1) - 1}
              totalRecords={records.length}
              totalPages={Math.ceil(records.length / pagination.limit)}
              initialRowsPerPage={pagination.limit}
              rowsPerPageOptions={[5, 10, 15, 20]}
              onPageChange={(newPage) =>
                handlePageChange(groupKey, newPage + 1)
              }
              onRowsPerPageChange={(newLimit) =>
                handleRowsPerPageChange(groupKey, newLimit)
              }
            />
          </Paper>
        );
      })}
    </Box>
  );
};

export default GroupedPricingDetailsTable;
