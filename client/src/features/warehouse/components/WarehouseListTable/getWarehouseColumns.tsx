import type { Column } from '@components/common/CustomTable';
import type { WarehouseRecord } from '@features/warehouse/state/warehouseTypes';
import { formatDate } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';

/**
 * Builds column definitions for the warehouse list table.
 *
 * - Uses WarehouseRecord as the data source
 * - Summary columns are included only when the user holds VIEW_SUMMARY permission
 * - Supports optional drill-down expansion via a toggle column
 */
export const getWarehouseColumns = (
  options: {
    canViewSummary?: boolean;
    expandedRowId?: string | null;
    handleDrillDownToggle?: (id: string) => void;
  } = {}
): Column<WarehouseRecord>[] => {
  const { canViewSummary = false, expandedRowId, handleDrillDownToggle } = options;
  
  return [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      renderCell: (row) => row.name,
    },
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      renderCell: (row) => row.code,
    },
    {
      id: 'location',
      label: 'Location',
      sortable: true,
      renderCell: (row) => row.location.name,
    },
    {
      id: 'warehouseType',
      label: 'Type',
      sortable: true,
      renderCell: (row) => formatLabel(row.warehouseType?.name ?? '—'),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.status.name ?? '—'),
    },
    {
      id: 'storageCapacity',
      label: 'Capacity',
      sortable: true,
      renderCell: (row) =>
        row.storageCapacity != null ? row.storageCapacity.toLocaleString() : '—',
    },
    {
      id: 'isArchived',
      label: 'Archived',
      sortable: false,
      renderCell: (row) => (row.isArchived ? 'Yes' : 'No'),
    },
    
    // ── Inventory summary — gated by canViewSummary ───────────────────────────
    ...(canViewSummary
      ? ([
        {
          id: 'totalQuantity',
          label: 'Total Qty',
          sortable: true,
          renderCell: (row) => row.summary.totalQuantity.toLocaleString(),
        },
        {
          id: 'totalReserved',
          label: 'Reserved',
          sortable: false,
          renderCell: (row) => row.summary.totalReserved.toLocaleString(),
        },
        {
          id: 'availableQuantity',
          label: 'Available',
          sortable: false,
          renderCell: (row) => row.summary.availableQuantity.toLocaleString(),
        },
        {
          id: 'totalBatches',
          label: 'Batches',
          sortable: false,
          renderCell: (row) => row.summary.totalBatches.toLocaleString(),
        },
      ] as Column<WarehouseRecord>[])
      : []),
    
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      renderCell: (row) => (row.status.date ? formatDate(row.status.date) : '—'),
    },
    
    // ── Drill-down toggle ─────────────────────────────────────────────────────
    ...(handleDrillDownToggle
      ? [
        createDrillDownColumn<WarehouseRecord>(
          (row) => handleDrillDownToggle(row.id),
          (row) => expandedRowId === row.id
        ),
      ]
      : []),
  ];
};
