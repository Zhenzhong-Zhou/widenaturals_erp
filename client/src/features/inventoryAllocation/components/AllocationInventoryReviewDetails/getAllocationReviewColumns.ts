import { type Column } from '@components/common/CustomTable';
import type { FlattenedAllocationReviewItem } from '@features/inventoryAllocation/utils/flattenAllocationReviewData';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { formatAllocationStatus, formatInventoryStatus, formatItemStatus } from '@utils/formatters';
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
  const getFormattedInventoryStatus = (row: any) => {
    const status = getPrimaryWarehouseField(row, 'statusName') ?? 'unknown';
    return formatInventoryStatus(status, formatLabel(status, { preserveHyphen: true }));
  };
  
  return [
    {
      id: 'name',
      label: 'Item',
      renderCell: (row) => getFallbackValue(row.productName, row.packagingMaterialLabel),
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
      renderCell: (row) => formatAllocationStatus(row.allocationStatusCode, formatLabel(row.allocationStatus)),
    },
    {
      id: 'warehouseStatus',
      label: 'Stock Status',
      renderCell: getFormattedInventoryStatus,
    },
    {
      id: 'orderItemQty',
      label: 'Order Qty',
      renderCell: (row) => getFallbackValue(row.quantityOrdered),
    },
    {
      id: 'orderItemStatus',
      label: 'Item Status',
      renderCell: (row) => formatItemStatus(row.orderItemStatusCode, row.orderItemStatusName),
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
