import { formatDateTime } from '@utils/dateTimeUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';
import StatusChip from '@components/common/StatusChip';
import type { OrderListItem } from '@features/order/state';
import { Link } from 'react-router-dom';

interface OrderTableProps {
  category: string;
  data: OrderListItem[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onRefresh: () => void;
}

// todo expanded row
const OrderTable = ({
                      category,
                      data,
                      loading,
                      page,
                      totalPages,
                      totalRecords,
                      rowsPerPage,
                      onPageChange,
                      onRowsPerPageChange,
                    }: OrderTableProps) => {
  const columns: Column<OrderListItem>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      minWidth: 160,
      sortable: true,
      renderCell: (row) => (
        <Link
          to={`/orders/${category}/details/${row.id}`}
          style={{
            textDecoration: 'none',
            color: '#1976D2',
            fontWeight: 'bold',
          }}
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      id: 'orderType',
      label: 'Order Type',
      minWidth: 180,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 140,
      renderCell: (row) => (
        <StatusChip label={row.status.name} />
      ),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      minWidth: 160,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 160,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      minWidth: 140,
    },
  ];
  
  return (
    <CustomTable
      data={data}
      columns={columns}
      loading={loading}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50, 75]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      getRowId={(row) => row.id}
      emptyMessage="No orders found"
    />
  );
};

export default OrderTable;
