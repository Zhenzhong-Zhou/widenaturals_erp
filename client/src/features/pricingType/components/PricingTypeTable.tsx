import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import type { PricingType } from '@features/pricingType';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatNullable } from '@utils/textUtils';
import type { PricingTypeTableProps } from '../state';

const PricingTypeTable: FC<PricingTypeTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const theme = useTheme();

  const columns: Column<PricingType>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      renderCell: (row: PricingType) => (
        <Link
          to={`/pricing-types/${row.slug}/${row.id}`}
          style={{
            textDecoration: 'none',
            color: theme.palette.primary.main,
            fontWeight: 500,
          }}
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: 'code',
      label: 'Code',
      sortable: false,
    },
    {
      id: 'slug',
      label: 'Slug',
      sortable: false,
    },
    { id: 'description', label: 'Description', sortable: false },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'createdByFullName',
      label: 'Created By',
      sortable: false,
      format: (value) => formatNullable(value),
    },
    {
      id: 'updatedByFullName',
      label: 'Updated By',
      sortable: false,
      format: (value) => formatNullable(value),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      initialRowsPerPage={rowsPerPage}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      rowsPerPageOptions={[5, 10, 25]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTypeTable;
