import { Link } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import type { Column } from '@components/common/CustomTable';
import { CustomButton } from '@components/index';
import type { WarehouseRecord } from '@features/warehouse/state/warehouseTypes';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

/**
 * Builds column definitions for the warehouse list table.
 *
 * - Uses WarehouseRecord as the data source
 * - Summary columns are included only when the user holds VIEW_SUMMARY permission
 * - Supports optional drill-down expansion via a toggle column
 */
export const getWarehouseColumns = (
  options: {
    canViewSummary?:          boolean;
    canViewDetails?:          boolean;
    canViewInventory?:        boolean;
    expandedRowId?:           string | null;
    handleDrillDownToggle?:   (id: string) => void;
  } = {}
): Column<WarehouseRecord>[] => {
  const {
    canViewSummary    = false,
    canViewDetails    = false,
    canViewInventory  = false,
    expandedRowId,
    handleDrillDownToggle,
  } = options;
  
  return [
    {
      id:       'name',
      label:    'Name',
      sortable: true,
      renderCell: (row) =>
        canViewDetails ? (
          <Link to={`/warehouses/${row.id}/details`}>{row.name}</Link>
        ) : (
          row.name
        ),
    },
    {
      id:       'location',
      label:    'Location',
      sortable: true,
      renderCell: (row) => row.location.name,
    },
    {
      id:       'warehouseType',
      label:    'Type',
      sortable: true,
      renderCell: (row) => formatLabel(row.warehouseType?.name ?? '—'),
    },
    {
      id:       'status',
      label:    'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.status.name ?? '—'),
    },
    {
      id:       'storageCapacity',
      label:    'Capacity',
      sortable: true,
      renderCell: (row) =>
        row.storageCapacity != null ? row.storageCapacity.toLocaleString() : '—',
    },
    {
      id:       'isArchived',
      label:    'Archived',
      sortable: false,
      renderCell: (row) => (row.isArchived ? 'Yes' : 'No'),
    },
    
    // ── Inventory summary — gated by canViewSummary ───────────────────────────
    ...(canViewSummary
      ? ([
        {
          id:       'totalQuantity',
          label:    'Total Qty',
          sortable: true,
          renderCell: (row) => row.summary.totalQuantity.toLocaleString(),
        },
        {
          id:       'totalReserved',
          label:    'Reserved',
          sortable: false,
          renderCell: (row) => row.summary.totalReserved.toLocaleString(),
        },
        {
          id:       'availableQuantity',
          label:    'Available',
          sortable: false,
          renderCell: (row) => row.summary.availableQuantity.toLocaleString(),
        },
        {
          id:       'totalBatches',
          label:    'Batches',
          sortable: false,
          renderCell: (row) => row.summary.totalBatches.toLocaleString(),
        },
      ] as Column<WarehouseRecord>[])
      : []),
    
    {
      id:       'statusDate',
      label:    'Status Date',
      sortable: true,
      renderCell: (row) => (row.status.date ? formatDate(row.status.date) : '—'),
    },
    
    // ── Inventory link — gated by canViewInventory ────────────────────────────
    ...(canViewInventory
      ? ([
        {
          id:       'inventory',
          label:    'Inventory',
          sortable: false,
          renderCell: (row) => (
            <CustomButton
              component={Link}
              to={`/warehouse-inventory/${row.id}/inventory`}
              size="small"
              variant="text"
              startIcon={<InventoryIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                fontWeight:    500,
                color:         'success.main',
                display:       'inline-flex',
                alignItems:    'center',
                lineHeight:    1,
                p:             '4px 8px',
                '& .MuiButton-startIcon': {
                  marginRight: '4px',
                  display:     'flex',
                  alignItems:  'center',
                },
              }}
            >
              Inventory
            </CustomButton>
          ),
        },
      ] as Column<WarehouseRecord>[])
      : []),
    
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
