import { type Column } from '@components/common/CustomTable';
import type { FlattenedAllocationReviewItem } from '@features/inventoryAllocation/utils/flattenAllocationReviewData';
import { formatDate } from '@utils/dateTimeUtils';
import { formatStatus } from '@utils/formatters';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { getFallbackValue } from '@utils/objectUtils';

export const getPrimaryWarehouseField = <
  K extends keyof FlattenedAllocationReviewItem['warehouseInventoryList'][0]
>(
  row: FlattenedAllocationReviewItem,
  field: K
): FlattenedAllocationReviewItem['warehouseInventoryList'][0][K] | null => {
  return row.warehouseInventoryList?.[0]?.[field] ?? null;
};

export const getAllocationReviewColumns = (
  expandedRowId: string | null,
  handleDrillDownToggle?: (id: string) => void
): Column<FlattenedAllocationReviewItem>[] => {
  return [
    {
      id: 'batchType',
      label: 'Type',
      renderCell: (row) => row.batchType === 'product' ? 'Product' :
        row.batchType === 'packaging_material' ? 'Packaging Material' : '—',
    },
    {
      id: 'name',
      label: 'Item',
      renderCell: (row) => getFallbackValue(row.productName, row.packagingMaterialLabel),
    },
    {
      id: 'barcode',
      label: 'Barcode',
      renderCell: (row) => getFallbackValue(row.barcode),
    },
    {
      id: 'sku_or_material_code',
      label: 'SKU / Code',
      renderCell: (row) => getFallbackValue(row.skuCode, row.packagingMaterialCode),
    },
    {
      id: 'lot',
      label: 'Lot #',
      renderCell: (row) => getFallbackValue(row.batchLotNumber),
    },
    {
      id: 'expiry',
      label: 'Expiry',
      renderCell: (row) => formatDate(row.batchExpiryDate),
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      renderCell: (row) => getFallbackValue(getPrimaryWarehouseField(row, 'warehouseName') ?? '—',),
    },
    {
      id: 'warehouseQty',
      label: 'Stock Qty',
      renderCell: (row) => getPrimaryWarehouseField(row, 'warehouseQuantity') ?? '—',
    },
    {
      id: 'reserved',
      label: 'Reserved',
      renderCell: (row) => getPrimaryWarehouseField(row, 'reservedQuantity') ?? '—',
    },
    {
      id: 'allocated',
      label: 'Allocated',
      renderCell: (row) => getFallbackValue(row.allocatedQuantity),
    },
    {
      id: 'allocationStatus',
      label: 'Alloc. Status',
      renderCell: (row) => formatStatus(row.allocationStatus),
    },
    {
      id: 'warehouseStatus',
      label: 'Stock Status',
      renderCell: (row) => formatStatus(getPrimaryWarehouseField(row, 'statusName') ?? '—'),
    },
    {
      id: 'orderItemQty',
      label: 'Order Qty',
      renderCell: (row) => getFallbackValue(row.quantityOrdered),
    },
    {
      id: 'orderItemStatus',
      label: 'Item Status',
      renderCell: (row) => formatStatus(row.orderItemStatusName),
    },
    {
      id: 'orderItemStatusDate',
      label: 'Status Date',
      renderCell: (row) => formatDate(row.orderItemStatusDate),
    },
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<FlattenedAllocationReviewItem>(
          (row) => handleDrillDownToggle(row.allocationId),
          (row) => expandedRowId === row.allocationId
        ),
      ]
      : []),
  ]
};
