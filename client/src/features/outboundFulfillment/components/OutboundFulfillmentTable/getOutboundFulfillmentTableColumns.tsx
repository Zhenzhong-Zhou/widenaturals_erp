import { Link } from 'react-router-dom';
import type { Column } from '@components/common/CustomTable';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import type { FlattenedOutboundShipmentRow } from '@features/outboundFulfillment/state';
import { getShortOrderNumber } from '@features/order/utils';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

/**
 * Builds column configuration for the Outbound Fulfillments table.
 *
 * IMPORTANT:
 * - This table consumes ONLY flattened shipment rows
 * - No raw API models are allowed here
 */
export const getOutboundFulfillmentTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedOutboundShipmentRow>[] => {
  const columns: Column<FlattenedOutboundShipmentRow>[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      minWidth: 180,
      sortable: true,
      renderCell: (row) =>
        row.shipmentId ? (
          <Link
            to={`/fulfillments/outbound-shipment/${row.shipmentId}`}
            state={{ orderNumber: row.orderNumber }}
            style={{
              textDecoration: 'none',
              color: '#1976D2',
              fontWeight: 600,
            }}
          >
            {getShortOrderNumber(row.orderNumber)}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'warehouseName',
      label: 'Warehouse',
      minWidth: 160,
      renderCell: (row) => formatLabel(row.warehouseName) ?? '—',
    },
    {
      id: 'deliveryMethodName',
      label: 'Delivery Method',
      minWidth: 160,
      renderCell: (row) => formatLabel(row.deliveryMethodName) ?? '—',
    },
    {
      id: 'statusName',
      label: 'Status',
      minWidth: 140,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
    {
      id: 'trackingNumber',
      label: 'Tracking Number',
      minWidth: 140,
      renderCell: (row) => formatLabel(row.trackingNumber) ?? '—',
    },
    {
      id: 'shippedAt',
      label: 'Shipped At',
      minWidth: 160,
      renderCell: (row) =>
        row.shippedAt ? formatDate(row.shippedAt) : '—',
    },
    {
      id: 'expectedDeliveryDate',
      label: 'Expected Delivery',
      minWidth: 160,
      renderCell: (row) =>
        row.expectedDelivery
          ? formatDate(row.expectedDelivery)
          : '—',
    },
    {
      id: 'createdByName',
      label: 'Created By',
      minWidth: 180,
      renderCell: (row) => formatLabel(row.createdByName) ?? '—',
    },
  ];
  
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedOutboundShipmentRow>(
        (row) => onDrillDownToggle(row.shipmentId),
        (row) => expandedRowId === row.shipmentId
      )
    );
  }
  
  return columns;
};
