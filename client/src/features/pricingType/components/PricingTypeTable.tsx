import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { PricingType } from '@features/pricingType';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel, formatNullable } from '@utils/textUtils';
import { useThemeContext } from '@context/ThemeContext.tsx';

interface PricingTypeTableProps {
  data: PricingType[];
  page: number; // zero-based for MUI
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const PricingTypeTable: FC<PricingTypeTableProps> = ({
                                                       data,
                                                       page,
                                                       rowsPerPage,
                                                       totalRecords,
                                                       totalPages,
                                                       onPageChange,
                                                       onRowsPerPageChange,
                                                     }) => {
  const { theme } = useThemeContext();
  
  const columns: Column<PricingType>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      renderCell: (row: PricingType) => (
        <Link
          to={`/pricing-types/${row.id}`}
          style={{ textDecoration: 'none', color: theme.palette.primary.main, fontWeight: 500 }}
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
      format: formatLabel,
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
