import type { Column } from '@components/common/CustomTable';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory/state/warehouseInventoryTypes';
import { formatDate } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';

/**
 * Builds column definitions for the warehouse inventory list table.
 *
 * - Uses FlattenedWarehouseInventory as the data source
 * - Renders product- vs packaging-specific identifiers based on batchType
 * - Drill-down toggle is gated by canViewDetail
 */
export const getWarehouseInventoryColumns = (
  options: {
    canViewDetail?: boolean;
    expandedRowId?: string | null;
    handleDrillDownToggle?: (id: string) => void;
  } = {}
): Column<FlattenedWarehouseInventory>[] => {
  const { canViewDetail = false, expandedRowId, handleDrillDownToggle } = options;
  
  return [
    {
      id: 'batchType',
      label: 'Type',
      sortable: true,
      renderCell: (row) => formatLabel(row.batchType),
    },
    {
      id: 'itemIdentifier',
      label: 'Item',
      sortable: false,
      renderCell: (row) =>
        row.batchType === 'product'
          ? (row.sku ?? '—')
          : (row.materialCode ?? '—'),
    },
    {
      id: 'itemName',
      label: 'Name',
      sortable: false,
      renderCell: (row) =>
        row.batchType === 'product'
          ? (row.displayName ?? '—')
          : (row.materialCode ?? '—'),
    },
    {
      id: 'lotNumber',
      label: 'Lot #',
      sortable: true,
      renderCell: (row) =>
        row.batchType === 'product'
          ? (row.lotNumber ?? '—')
          : (row.packagingLotNumber ?? '—'),
    },
    {
      id: 'sizeLabel',
      label: 'Size',
      sortable: false,
      renderCell: (row) => row.sizeLabel ?? '—',
    },
    {
      id: 'warehouseQuantity',
      label: 'On Hand',
      sortable: true,
      renderCell: (row) => row.warehouseQuantity.toLocaleString(),
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved',
      sortable: true,
      renderCell: (row) => row.reservedQuantity.toLocaleString(),
    },
    {
      id: 'availableQuantity',
      label: 'Available',
      sortable: true,
      renderCell: (row) => row.availableQuantity.toLocaleString(),
    },
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName ?? '—'),
    },
    {
      id: 'inboundDate',
      label: 'Inbound',
      sortable: true,
      renderCell: (row) => (row.inboundDate ? formatDate(row.inboundDate) : '—'),
    },
    {
      id: 'outboundDate',
      label: 'Outbound',
      sortable: true,
      renderCell: (row) => (row.outboundDate ? formatDate(row.outboundDate) : '—'),
    },
    {
      id: 'lastMovementAt',
      label: 'Last Movement',
      sortable: true,
      renderCell: (row) =>
        row.lastMovementAt ? formatDate(row.lastMovementAt) : '—',
    },
    
    // ── Drill-down toggle — gated by canViewDetail ────────────────────────────
    ...(canViewDetail && handleDrillDownToggle
      ? [
        createDrillDownColumn<FlattenedWarehouseInventory>(
          (row) => handleDrillDownToggle(row.id),
          (row) => expandedRowId === row.id
        ),
      ]
      : []),
  ];
};
