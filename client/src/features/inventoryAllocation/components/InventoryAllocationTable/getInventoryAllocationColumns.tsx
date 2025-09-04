import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import StatusChip from '@components/common/StatusChip';
import { formatDate } from '@utils/dateTimeUtils';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import type { InventoryAllocationSummary } from '@features/inventoryAllocation/state';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

export const getInventoryAllocationColumns = (
  expandedRowId?: string | null,
  handleDrillDownToggle?: (id: string) => void,
): Column<InventoryAllocationSummary>[] => {
  return [
    {
      id: 'orderNumber',
      label: 'Order #',
      sortable: true,
      renderCell: (row) => (
        <Link
          to={{
            pathname: `/inventory-allocations/review/${row.orderId}`,
          }}
          state={{
            warehouseIds: row.warehouses.ids,        // from your table row
            allocationIds: row.allocationIds,      // from your table row
            category: row.orderCategory,                     // or derive dynamically
          }}
          style={{
            textDecoration: 'none',
            color: '#1976D2',
            fontWeight: 'bold',
          }}
        >
          {getShortOrderNumber(row.orderNumber)}
        </Link>
      )
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
      renderCell: (row) => (
        <StatusChip label={row.orderStatus.name} />
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      renderCell: (row) => row.customer.fullName,
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
      renderCell: (row) => (
        <StatusChip label={row.paymentStatus ?? '—'} />
      ),
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
      renderCell: (row) =>
        `${row.itemCount.allocated} / ${row.itemCount.total}`,
    },
    {
      id: 'warehouses',
      label: 'Warehouses',
      sortable: false,
      renderCell: (row) => row.warehouses.names,
    },
    {
      id: 'allocationStatus',
      label: 'Allocation Status',
      sortable: false,
      renderCell: (row) => (
        <StatusChip label={row.allocationStatus.summary} />
      ),
    },
    {
      id: 'orderCreatedAt',
      label: 'Order Date',
      sortable: true,
      format: (value) =>
        typeof value === 'string' ? formatDate(value) : '—',
    },
    {
      id: 'createdBy',
      label: 'Created By',
      sortable: true,
    },
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<InventoryAllocationSummary>(
          (row) => handleDrillDownToggle(row.orderId),
          (row) => expandedRowId === row.orderId
        ),
      ]
      : []),
  ];
};
