import { FC } from 'react';
import { PricingTypeTableProps } from '../state/pricingTypeTypes.ts';
import { CustomTable } from '@components/index.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { Link } from 'react-router-dom';
import { formatLabel } from '@utils/textUtils.ts';

const PricingTypeTable: FC<PricingTypeTableProps> = ({
  data,
  totalPages,
  totalRecords,
  rowsPerPage,
  page,
  onPageChange,
  onRowsPerPageChange,
}) => {
  // Define columns for the DataTable
  const columns = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      format: (value: string) => value,
      renderCell: (row: any) => (
        <Link
          to={`/pricing_types/${row.id}`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.name}
        </Link>
      ),
    },
    { id: 'description', label: 'Description', sortable: false },
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
      format: (value: string | number | Date) => formatDateTime(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: string | number | Date) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string | number | Date) => formatDateTime(value),
    },
    { id: 'created_by_fullname', label: 'Created By', sortable: true },
    { id: 'updated_by_fullname', label: 'Updated By', sortable: true },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      rowsPerPageOptions={[5, 10, 25]}
      initialRowsPerPage={rowsPerPage}
      totalRecords={totalRecords}
      totalPages={totalPages}
      page={page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTypeTable;
