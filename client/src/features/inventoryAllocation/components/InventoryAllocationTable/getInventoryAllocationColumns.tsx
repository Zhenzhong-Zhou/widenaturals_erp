import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import type { FlattenedInventoryAllocationSummary } from '@features/inventoryAllocation/state';
import { getShortOrderNumber } from '@features/order/utils';
import { formatDate } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import {
  formatAllocationStatus,
  formatOrderStatus,
  formatPaymentStatus,
} from '@utils/formatters';

/**
 * Builds column definitions for the inventory allocation summary table.
 *
 * - Uses flattened allocation summary records as the data source
 * - Supports optional drill-down expansion via a toggle column
 * - Intended for list and overview table views
 */
export const getInventoryAllocationColumns = (
  expandedRowId?: string | null,
  handleDrillDownToggle?: (id: string) => void
): Column<FlattenedInventoryAllocationSummary>[] => {
  return [
    {
      id: 'orderNumber',
      label: 'Order #',
      sortable: true,
      renderCell: (row) => (
        <Link
          to={`/inventory-allocations/review/${row.orderId}`}
          state={{
            warehouseIds: row.warehouseIds,
            allocationIds: row.allocationIds,
            category: row.orderCategory,
          }}
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
      sortable: true,
      renderCell: (row) => row.orderType ?? '—',
    },
    {
      id: 'orderStatus',
      label: 'Status',
      sortable: true,
      renderCell: (row) =>
        formatOrderStatus(row.orderStatusCode, row.orderStatusName),
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      renderCell: (row) => row.customerName,
    },
    {
      id: 'paymentMethod',
      label: 'Payment Method',
      sortable: true,
      renderCell: (row) => row.paymentMethod ?? '—',
    },
    {
      id: 'paymentStatus',
      label: 'Payment Status',
      sortable: true,
      renderCell: (row) =>
        formatPaymentStatus(row.paymentStatusCode, row.paymentStatusName),
    },
    {
      id: 'deliveryMethod',
      label: 'Delivery Method',
      sortable: true,
      renderCell: (row) => row.deliveryMethod ?? '—',
    },
    {
      id: 'itemCount',
      label: 'Allocated / Total Items',
      sortable: false,
      renderCell: (row) => `${row.allocatedItemCount} / ${row.totalItemCount}`,
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      sortable: false,
      renderCell: (row) => row.warehouseNames,
    },
    {
      id: 'allocationStatus',
      label: 'Allocation Status',
      sortable: false,
      renderCell: (row) =>
        formatAllocationStatus(
          row.allocationStatusCodes,
          row.allocationSummaryStatus
        ),
    },
    {
      id: 'orderCreatedAt',
      label: 'Order Date',
      sortable: true,
      format: (value) => (typeof value === 'string' ? formatDate(value) : '—'),
    },
    {
      id: 'orderCreatedBy',
      label: 'Order Created By',
      sortable: true,
    },
    ...(handleDrillDownToggle
      ? [
          createDrillDownColumn<FlattenedInventoryAllocationSummary>(
            (row) => handleDrillDownToggle(row.orderId),
            (row) => expandedRowId === row.orderId
          ),
        ]
      : []),
  ];
};
