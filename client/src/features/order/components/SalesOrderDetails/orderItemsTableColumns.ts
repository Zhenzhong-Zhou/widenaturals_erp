import { type Column } from '@components/common/CustomTable.tsx';
import { type FlattenedOrderItemRow } from '@features/order/state';
import { formatCurrency, formatLabel } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn.tsx';
import { formatItemStatus } from '@utils/formatters.tsx';

export const getOrderItemColumns = (
  expandedRowId: string | null,
  handleDrillDownToggle?: (id: string) => void
): Column<FlattenedOrderItemRow>[] => {
  return [
    {
      id: 'line_type',
      label: 'Type',
      renderCell: (row) =>
        row.itemType === 'sku'
          ? 'Product'
          : row.itemType === 'packaging_material'
            ? 'Packaging Material'
            : '—',
    },
    {
      id: 'item_name',
      label: 'Item',
      renderCell: (row) => row.itemName ?? '—',
    },
    {
      id: 'code',
      label: 'Code',
      renderCell: (row) =>
        row.itemType === 'sku'
          ? row.skuCode ?? '—'
          : row.packagingMaterialCode ?? '—',
    },
    {
      id: 'barcode',
      label: 'Barcode',
      renderCell: (row) =>
        row.itemType === 'sku' ? row.barcode ?? '—' : '—',
    },
    {
      id: 'quantityOrdered',
      label: 'Qty',
      renderCell: (row) => row.quantityOrdered,
    },
    {
      id: 'priceName',
      label: 'Price Name',
      renderCell: (row) =>
        row.priceTypeName ? formatLabel(row.priceTypeName) : '—',
    },
    {
      id: 'unitPrice',
      label: 'Unit Price',
      renderCell: (row) =>
        row.unitPrice != null ? formatCurrency(row.unitPrice) : '—',
    },
    {
      id: 'subtotal',
      label: 'Subtotal',
      renderCell: (row) =>
        row.subtotal != null ? formatCurrency(row.subtotal) : '—',
    },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) =>
        formatItemStatus(row.statusCode, row.statusName),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      renderCell: (row) => formatDate(row.statusDate),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      renderCell: (row) => formatDate(row.createdAt),
    },
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<FlattenedOrderItemRow>(
          (row) => handleDrillDownToggle(row.orderItemId),
          (row) => expandedRowId === row.orderItemId
        ),
      ]
      : []),
  ];
};
