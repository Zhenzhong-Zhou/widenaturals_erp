import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import StatusChip from '@components/common/StatusChip';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import type { OrderListItem } from '@features/order/state';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

export const getOrdersTableColumns = (
  category: string,
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<OrderListItem>[] => {
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
      renderCell: (row) => <StatusChip label={row.status.name} />,
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
  ];
  
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<OrderListItem>(
        (row) => onDrillDownToggle(row.id),
        (row) => expandedRowId === row.id
      )
    );
  }
  
  return columns;
};
