/**
 * @fileoverview
 * Defines column configurations for both the **Outbound Fulfillment Table** and its
 * associated **Fulfillment Batches Mini Table**.
 *
 * These column definitions are consumed by reusable table components:
 *  - `<CustomTable>` → for displaying outbound fulfillments
 *  - `<CustomMiniTable>` → for displaying shipment batch rows within expanded sections
 *
 * Each column includes:
 *  - `id`: unique key used for column mapping
 *  - `label`: header display text
 *  - `renderCell`: cell renderer for formatting values (dates, statuses, fallback text, etc.)
 *
 * The `outboundFulfillmentTableColumns` function optionally injects a drill-down
 * expand/collapse column when a `handleDrillDownToggle` callback is provided.
 */

import type { Column } from '@components/common/CustomTable';
import type { FlattenedBatchRow, FlattenedFulfillmentRow } from '@features/outboundFulfillment/state';
import { getFallbackValue } from '@utils/objectUtils';
import { formatFulfillmentStatus } from '@utils/formatters';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import type { MiniColumn } from '@components/common/CustomMiniTable';
import { formatLabel } from '@utils/textUtils';

/**
 * Builds the column configuration for the **Outbound Fulfillment Table**.
 *
 * Displays fulfillment-level information such as:
 *  - Item / SKU / Barcode
 *  - Region, Size label
 *  - Ordered and fulfilled quantities
 *  - Fulfillment status and timestamp
 *
 * When `handleDrillDownToggle` is provided, a final column is appended for
 * expand/collapse interaction.
 *
 * @param {string | null} [expandedRowId] - ID of the currently expanded fulfillment row (optional)
 * @param {(id: string) => void} [handleDrillDownToggle] - Callback to toggle expanded state (optional)
 * @returns {Column<FlattenedFulfillmentRow>[]} Configured fulfillment table columns
 *
 * @example
 * <CustomTable
 *   columns={outboundFulfillmentTableColumns(expandedId, handleToggle)}
 *   data={fulfillments}
 * />
 */
export const outboundFulfillmentTableColumns = (
  expandedRowId?: string | null,
  handleDrillDownToggle?: (id: string) => void,
): Column<FlattenedFulfillmentRow>[] => {
  return  [
    {
      id: 'item',
      label: 'Item',
      renderCell: (row) =>
        getFallbackValue(row.productName, row.packagingMaterialLabel),
    },
    {
      id: 'sku_or_code',
      label: 'SKU / Code',
      renderCell: (row) => getFallbackValue(row.skuCode, row.packagingMaterialCode),
    },
    {
      id: 'barcode',
      label: 'Barcode',
      renderCell: (row) => getFallbackValue(row.barcode),
    },
    {
      id: 'region',
      label: 'Region',
      renderCell: (row) => getFallbackValue(row.region),
    },
    {
      id: 'sizeLabel',
      label: 'Size Label',
      renderCell: (row) => getFallbackValue(row.sizeLabel),
    },
    {
      id: 'orderQty',
      label: 'Order Qty',
      renderCell: (row) => row.orderItemQuantity ?? '—',
    },
    {
      id: 'fulfilledQty',
      label: 'Fulfilled Qty',
      renderCell: (row) => row.quantityFulfilled ?? '—',
    },
    {
      id: 'fulfillmentStatus',
      label: 'Fulfillment Status',
      renderCell: (row) =>
        formatFulfillmentStatus(
          row.fulfillmentStatusCode,
          row.fulfillmentStatusName
        ),
    },
    {
      id: 'fulfillmentAt',
      label: 'Fulfillment At',
      renderCell: (row) =>
        formatDateTime(row.fulfilledAt),
    },
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<FlattenedFulfillmentRow>(
          (row) => handleDrillDownToggle(row.fulfillmentId),
          (row) => expandedRowId === row.fulfillmentId
        ),
      ]
      : []),
  ];
};

/**
 * Column configuration for the **Fulfillment Batches Mini Table**.
 *
 * Displays batch-level details nested under each fulfillment, including:
 *  - Batch type (product or packaging material)
 *  - Lot number and expiry
 *  - Quantity shipped
 *  - Audit info (created date, created by)
 *  - Optional notes
 *
 * @type {MiniColumn<FlattenedBatchRow>[]}
 *
 * @example
 * <CustomMiniTable
 *   columns={outboundFulfillmentBatchColumns}
 *   data={fulfillment.batches}
 * />
 */
export const outboundFulfillmentBatchColumns: MiniColumn<FlattenedBatchRow>[] = [
  {
    id: 'batchType',
    label: 'Type',
    renderCell: (row) => formatLabel(row.batchType ?? '—'),
  },
  {
    id: 'lotNumber',
    label: 'Lot #',
    renderCell: (row) => row.lotNumber ?? '—',
  },
  {
    id: 'expiryDate',
    label: 'Expiry',
    renderCell: (row) => formatDate(row.expiryDate),
  },
  {
    id: 'quantityShipped',
    label: 'Shipped Qty',
    renderCell: (row) => row.quantityShipped ?? '—',
  },
  {
    id: 'createdAt',
    label: 'Created At',
    renderCell: (row) => formatDateTime(row.createdAt) ?? '—',
  },
  {
    id: 'createdByName',
    label: 'Created By',
    renderCell: (row) => row.createdByName ?? '—',
  },
  {
    id: 'notes',
    label: 'Notes',
    renderCell: (row) => row.notes ?? '—',
  },
];
