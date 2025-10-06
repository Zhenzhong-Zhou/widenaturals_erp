import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import type { OutboundShipmentRecord } from '@features/outboundFulfillment/state';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils.ts';

/**
 * Builds column configuration for the Outbound Fulfillments table.
 *
 * @param expandedRowId - ID of the currently expanded row (if any).
 * @param onDrillDownToggle - Callback to toggle drill-down expansion.
 * @returns Column configuration for OutboundShipmentRecord rows.
 */
export const getOutboundFulfillmentTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<OutboundShipmentRecord>[] => {
  const columns: Column<OutboundShipmentRecord>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      minWidth: 180,
      sortable: true,
      renderCell: (row) =>
        row.shipmentId ? (
          <Link
            to={`/fulfillments/outbound-shipment/${row.shipmentId}`}
            state={{ orderNumber: row.order.number }}
            style={{
              textDecoration: 'none',
              color: '#1976D2',
              fontWeight: 'bold',
            }}
          >
            {getShortOrderNumber(row.order.number)}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'warehouseName',
      label: 'Warehouse',
      minWidth: 160,
      renderCell: (row) => formatLabel(row.warehouse?.name) ?? '—',
    },
    {
      id: 'deliveryMethod',
      label: 'Delivery Method',
      minWidth: 160,
      renderCell: (row) => formatLabel(row.deliveryMethod?.name) ?? '—',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 140,
      renderCell: (row) => formatLabel(row.status?.name) ?? '—',
    },
    {
      id: 'trackingNumber',
      label: 'Tracking Number',
      minWidth: 140,
      renderCell: (row) => formatLabel(row.trackingNumber?.number) ?? '—',
    },
    {
      id: 'shippedAt',
      label: 'Shipped At',
      minWidth: 160,
      renderCell: (row) =>
        row.dates?.shippedAt ? formatDate(row.dates.shippedAt) : '—',
    },
    {
      id: 'expectedDelivery',
      label: 'Expected Delivery',
      minWidth: 160,
      renderCell: (row) =>
        row.dates?.expectedDelivery
          ? formatDate(row.dates.expectedDelivery)
          : '—',
    },
    {
      id: 'createdBy',
      label: 'Created By',
      minWidth: 180,
      renderCell: (row) => formatLabel(row.audit?.createdBy?.fullName) ?? '—',
    },
  ];
  
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<OutboundShipmentRecord>(
        (row) => onDrillDownToggle(row.shipmentId),
        (row) => expandedRowId === row.shipmentId
      )
    );
  }
  
  return columns;
};
