import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import type { OrderListItem } from '@features/order/state';
import { getShortOrderNumber } from '@features/order/utils';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatOrderStatus, formatPaymentStatus } from '@utils/formatters';

/**
 * getOrdersTableColumns
 *
 * Factory function that builds column definitions for the Orders list table.
 * Designed for reuse across different order categories (sales, purchase,
 * allocatable, etc.) with optional expandable row support.
 *
 * Responsibilities:
 * - Define presentation and formatting for order list fields
 * - Generate category-aware order detail links
 * - Optionally inject a drill-down (expand/collapse) column
 *
 * Notes:
 * - Assumes `OrderListItem` is already UI-normalized
 * - Does not perform data transformation or filtering
 *
 * @param category - Order category used to construct the detail page route
 * @param expandedRowId - Currently expanded order row ID (if any)
 * @param onDrillDownToggle - Optional callback to toggle row expansion
 * @returns Column definitions for the Orders table
 */
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
      renderCell: (row) =>
        formatOrderStatus(row.orderStatus.code, row.orderStatus.name),
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
      renderCell: (row) =>
        formatPaymentStatus(
          row.paymentStatus.code,
          row.paymentStatus.name
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
  
  // Optionally append a drill-down column for expandable row layouts
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
