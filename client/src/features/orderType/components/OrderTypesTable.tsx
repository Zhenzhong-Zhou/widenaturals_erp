import { FC } from 'react';
import { OrderType } from '@features/order';
import CustomTable from '@components/common/CustomTable';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';

interface OrderTypesTableProps {
  data: OrderType[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

const OrderTypesTable: FC<OrderTypesTableProps> = ({
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
      id: 'name',
      label: 'Order Type',
      minWidth: 170,
      sortable: true,
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 150,
      sortable: true,
      format: (value: string) => formatLabel(value),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 250,
    },
    {
      id: 'status_name',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatLabel(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'created_at',
      label: 'Created At',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'updated_by',
      label: 'Updated By',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      minWidth: 100,
      sortable: true,
      format: (value: string) => formatDate(value),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50]}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default OrderTypesTable;
