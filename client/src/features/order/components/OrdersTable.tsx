import { formatDateTime } from '@utils/dateTimeUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';
import StatusChip from '@components/common/StatusChip';
import type { OrderListItem } from '@features/order/state';
import { Link } from 'react-router-dom';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography.tsx';
import CustomButton from '@components/common/CustomButton.tsx';

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
                      onRefresh,
                    }: OrderTableProps) => {
  const columns: Column<OrderListItem>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
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
          {getShortOrderNumber(row.orderNumber)}
        </Link>
      ),
    },
    {
      id: 'orderType',
      label: 'Order Type',
    },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) => (
        <StatusChip label={row.status.name} />
      ),
    },
    {
      id: 'customerName',
      label: 'Customer',
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
    },
    {
      id: 'paymentStatus',
      label: 'Payment Status',
      renderCell: (row) => (
        <StatusChip label={row.paymentStatus ?? 'UNKNOWN'} />
      ),
    },
    {
      id: 'deliveryMethod',
      label: 'Delivery Method',
    },
    {
      id: 'numberOfItems',
      label: '# Items',
      align: 'right',
    },
    {
      id: 'orderDate',
      label: 'Order Date',
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'createdBy',
      label: 'Created By',
    },
    {
      id: 'action',
      label: 'Action'
    }
  ];
  
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Order List
        </CustomTypography>
        
        <CustomButton
          onClick={onRefresh}
          variant="outlined"
          sx={{ color: 'primary', fontWeight: 500 }}
        >
          Refresh
        </CustomButton>
      </Box>
        
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
    </Box>
  );
};

export default OrderTable;
