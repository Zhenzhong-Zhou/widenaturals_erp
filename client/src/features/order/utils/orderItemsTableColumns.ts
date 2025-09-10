import { type Column } from '@components/common/CustomTable';
import type { OrderItem } from '@features/order/state';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatItemStatus } from '@utils/formatters';

export const getOrderItemColumns = (
  expandedRowId: string | null,
  handleDrillDownToggle?: (id: string) => void
): Column<OrderItem>[] => {
  return [
    {
      id: 'line_type',
      label: 'Type',
      renderCell: (row) =>
        row.sku ? 'Product' : row.packagingMaterial ? 'Packaging Material' : '—',
    },
    {
      id: 'product_or_material',
      label: 'Item',
      renderCell: (row) => {
        if (row.sku) {
          return `${row.displayName ?? '—'}`;
        } else if (row.packagingMaterial) {
          return row.packagingMaterial.name;
        }
        return '—';
      },
    },
    {
      id: 'sku_or_code',
      label: 'Code',
      renderCell: (row) =>
        row.sku ? row.sku.code ?? '—' : row.packagingMaterial?.code ?? '—',
    },
    {
      id: 'barcode',
      label: 'Barcode',
      renderCell: (row) => row.sku?.barcode ?? '—',
    },
    {
      id: 'quantityOrdered',
      label: 'Qty',
      renderCell: (row) => row.quantityOrdered ?? '—',
    },
    {
      id: 'priceName',
      label: 'Price Name',
      renderCell: (row) => row.priceId ? formatLabel(row.priceTypeName) : '—',
    },
    {
      id: 'listPrice',
      label: 'List Price',
      renderCell: (row) => formatCurrency(row.listedPrice) ?? '—',
    },
    {
      id: 'price',
      label: 'Unit Price',
      renderCell: (row) =>
        row.price != null ? formatCurrency(row.price) : '—',
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
      renderCell: (row) => formatItemStatus(row.status?.code, row.status?.name),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      renderCell: (row) =>
        row.status?.date ? formatDate(row.status.date) : '—',
    },
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<OrderItem>(
          (row) => handleDrillDownToggle(row.id),
          (row) => expandedRowId === row.id
        ),
      ]
      : []),
  ];
};
