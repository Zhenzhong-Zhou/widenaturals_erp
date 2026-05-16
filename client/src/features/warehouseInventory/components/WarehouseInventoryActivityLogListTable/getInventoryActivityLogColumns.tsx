import { Box, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { TruncatedText } from '@components/index';
import type { Column } from '@components/common/CustomTable';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import {
  formatQuantityChange,
  quantityChangeColor,
} from '@features/warehouseInventory/components/WarehouseInventoryActivityLogListTable/inventoryActivityLogFormatters';
import type { InventoryActivityLogRecord } from '@features/warehouseInventory';

/**
 * Builds column definitions for the warehouse inventory activity log mini table.
 *
 * - Uses InventoryActivityLogRecord as the data source
 * - Keeps main table focused on timeline + quantity movement
 * - Drill-down toggle is gated by canViewDetail
 */
export const getInventoryActivityLogColumns = (
  options: {
    canViewDetail?: boolean;
    expandedRowId?: string | null;
    handleDrillDownToggle?: (id: string) => void;
    showItemContext?: boolean;
  } = {}
): Column<InventoryActivityLogRecord>[] => {
  const {
    canViewDetail = false,
    expandedRowId,
    handleDrillDownToggle,
    showItemContext = false,
  } = options;

  return [
    {
      id: 'performedAt',
      label: 'When',
      format: (value) => formatDateTime(value as string) ?? '—',
    },
    // ── Item context — inserted only when scope isn't pre-narrowed ─────────
    ...(showItemContext
      ? [
          {
            id: 'batchType',
            label: 'Type',
            sortable: true,
            renderCell: (row: InventoryActivityLogRecord) =>
              formatLabel(row.batchType),
          },
          {
            id: 'entityName',
            label: 'Entity',
            sortable: false,
            renderCell: (row: InventoryActivityLogRecord) => (
              <TruncatedText
                text={
                  row.batchType === 'product'
                    ? row.productName
                    : row.packagingDisplayName
                }
                maxLength={20}
                variant="body2"
                sx={{ fontWeight: 400 }}
              />
            ),
          },
          {
            id: 'lotNumber',
            label: 'Lot Number',
            sortable: true,
            renderCell: (row: InventoryActivityLogRecord) =>
              row.batchType === 'product'
                ? row.productLotNumber
                : row.packagingLotNumber,
          },
        ]
      : []),
    {
      id: 'actionTypeName',
      label: 'Action',
      renderCell: (row) => formatLabel(row.actionTypeName),
    },
    {
      id: 'quantityChange',
      label: 'Qty Δ',
      align: 'right',
      renderCell: (row) => (
        <Box
          component="span"
          sx={{
            color: quantityChangeColor(row.quantityChange),
            fontWeight: 500,
          }}
        >
          {formatQuantityChange(row.quantityChange)}
        </Box>
      ),
    },
    {
      id: 'newQuantity',
      label: 'Quantity',
      align: 'right',
      renderCell: (row) =>
        `${row.previousQuantity.toLocaleString()} → ${row.newQuantity.toLocaleString()}`,
    },
    {
      id: 'status',
      label: 'Status',
      renderCell: (row) => formatLabel(row.status?.name ?? null),
    },
    {
      id: 'performedByName',
      label: 'By',
      format: (value) => (value as string | null) ?? '—',
    },
    {
      id: 'comments',
      label: 'Comments',
      renderCell: (row) =>
        row.comments ? (
          <TruncatedText text={row.comments} maxLength={40} />
        ) : (
          '—'
        ),
    },

    // ── Drill-down toggle — gated by canViewDetail ────────────────────────────
    ...(canViewDetail && handleDrillDownToggle
      ? [
          {
            id: 'details',
            label: '',
            align: 'center' as const,
            renderCell: (row: InventoryActivityLogRecord) => {
              const isExpanded = expandedRowId === row.id;

              return (
                <IconButton
                  size="small"
                  aria-label={
                    isExpanded
                      ? 'Collapse activity log details'
                      : 'Expand activity log details'
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDrillDownToggle(row.id);
                  }}
                >
                  {isExpanded ? (
                    <KeyboardArrowDownIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowRightIcon fontSize="small" />
                  )}
                </IconButton>
              );
            },
          },
        ]
      : []),
  ];
};
