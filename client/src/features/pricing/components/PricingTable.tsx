import { FC } from 'react';
import { Pricing } from '../state/pricingTypes.ts';
import { formatLabel, formatCurrency } from '@utils/textUtils.ts';
import { CustomTable } from '@components/index.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { Link } from 'react-router-dom';

interface PricingTableProps {
  data: Pricing[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const PricingTable: FC<PricingTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const columns = [
    {
      id: 'product_name',
      label: 'Product Name',
      sortable: true,
    },
    {
      id: 'location',
      label: 'Location Name',
      sortable: true,
    },
    {
      id: 'price_type',
      label: 'Price Type',
      sortable: true,
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      format: (value: string) => formatCurrency(value),
      renderCell: (row: any) => (
        <Link
          to={`/pricings/${row.pricing_id}`}
          style={{ textDecoration: 'none', color: 'red' }}
        >
          {formatCurrency(row.price)}
        </Link>
      ),
    },
    {
      id: 'valid_from',
      label: 'Valid From',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'valid_to',
      label: 'Valid To',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value: string) => formatLabel(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: true,
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      sortable: true,
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      totalRecords={totalRecords}
      totalPages={totalPages}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50, 75]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTable;
