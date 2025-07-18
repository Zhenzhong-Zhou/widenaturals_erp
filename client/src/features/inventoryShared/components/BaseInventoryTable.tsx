import { type ReactNode, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import CustomTable, { type Column } from '@components/common/CustomTable';
import StockLevelChip, {
  type StockLevelChipProps,
} from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip, {
  type ExpirySeverityChipProps,
} from '@features/inventoryShared/components/ExpirySeverityChip';
import type { FlatInventoryRowBase } from '@features/inventoryShared/types/InventorySharedType.ts';
import Tooltip from '@mui/material/Tooltip';
import { getGroupedRowProps } from '@utils/table/tableRowPropsUtils.ts';

interface BaseInventoryTableProps<T> {
  isLoading: boolean;
  groupedData: Record<string, T[]>;
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  showCheckboxes?: boolean;
  showActions?: boolean;
  expandedRowId?: string | null;
  onExpandToggle?: (row: any) => void;
  isRowExpanded?: (row: any) => boolean;
  expandedContent?: (row: any) => ReactNode;
  groupKey: 'location' | 'warehouse';
  getRowData: (record: T) => any;
  getGroupHeaderId: (groupName: string) => string;
  onAdjustSingle?: (row: any) => void;
  selectedRowIds?: string[];
  onSelectionChange?: (selectedIds: string[], selectedRecords: T[]) => void;
}

const BaseInventoryTable = <T,>({
  isLoading,
  groupedData,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
  showCheckboxes = true,
  showActions = true,
  expandedRowId,
  onExpandToggle,
  isRowExpanded,
  expandedContent,
  groupKey,
  getRowData,
  getGroupHeaderId,
  onAdjustSingle,
  selectedRowIds,
  onSelectionChange,
}: BaseInventoryTableProps<T>) => {
  const quantityId =
    groupKey === 'warehouse' ? 'warehouseQuantity' : 'locationQuantity';
  const quantityLabel =
    groupKey === 'warehouse' ? 'Warehouse QTY' : 'Location QTY';

  const renderStockLevelCell = useCallback(
    (row: FlatInventoryRowBase<T>) => (
      <StockLevelChip
        stockLevel={row.stockLevel as StockLevelChipProps['stockLevel']}
      />
    ),
    []
  );

  const renderExpirySeverityCell = useCallback(
    (row: FlatInventoryRowBase<T>) => (
      <ExpirySeverityChip
        severity={row.expirySeverity as ExpirySeverityChipProps['severity']}
      />
    ),
    []
  );

  const columns: Column<FlatInventoryRowBase<T>>[] = useMemo(() => {
    return [
      { id: 'name', label: 'Name' },
      { id: 'lotNumber', label: 'Lot #' },
      { id: 'expiryDate', label: 'Expiry Date' },
      { id: quantityId, label: quantityLabel },
      { id: 'available', label: 'Available' },
      { id: 'reserved', label: 'Reserved' },
      { id: 'lastUpdate', label: 'Last Update' },
      { id: 'status', label: 'Status' },
      { id: 'statusDate', label: 'Status Date' },
      {
        id: 'stockLevel',
        label: 'Stock Level',
        renderCell: renderStockLevelCell,
      },
      {
        id: 'expirySeverity',
        label: 'Expiry Severity',
        renderCell: renderExpirySeverityCell,
      },
      {
        id: 'expand',
        label: '',
        align: 'center' as const,
        renderCell: (row) =>
          row.isGroupHeader ? null : (
            <IconButton onClick={() => onExpandToggle?.(row)}>
              {isRowExpanded?.(row) ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </IconButton>
          ),
      },
      ...(showActions
        ? [
            {
              id: 'actions',
              label: 'Actions',
              align: 'center' as const,
              renderCell: (row: FlatInventoryRowBase<T>) =>
                !row.isGroupHeader &&
                onAdjustSingle && (
                  <Tooltip title="Adjust Quantity">
                    <IconButton onClick={() => onAdjustSingle(row)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                ),
            },
          ]
        : []),
    ];
  }, [
    quantityId,
    quantityLabel,
    renderStockLevelCell,
    renderExpirySeverityCell,
    onExpandToggle,
    isRowExpanded,
    showActions,
    onAdjustSingle,
  ]);

  const flattenedWithHeaders: any[] = [];

  Object.entries(groupedData).forEach(([groupName, records]) => {
    flattenedWithHeaders.push({
      id: getGroupHeaderId(groupName),
      name: `-- ${groupName} --`,
      isGroupHeader: true,
    });

    records.forEach((record) => {
      flattenedWithHeaders.push(getRowData(record));
    });
  });

  const selectableRows = flattenedWithHeaders.filter(
    (row) => !row.isGroupHeader
  );

  return (
    <CustomTable
      loading={isLoading}
      columns={columns}
      data={flattenedWithHeaders}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[30, 50, 75, 100]}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="No inventory records found."
      getRowProps={getGroupedRowProps(columns.length)}
      expandedContent={expandedContent}
      expandable={!!expandedRowId}
      expandedRowId={expandedRowId}
      getRowId={(row) => row.id}
      selectedRowIds={selectedRowIds}
      onSelectionChange={
        showCheckboxes
          ? (ids: string[]) => {
              if (onSelectionChange) {
                const selectedRecords = selectableRows.filter((row) =>
                  ids.includes(row.id)
                );
                onSelectionChange(ids, selectedRecords);
              }
            }
          : undefined
      }
      showCheckboxes={showCheckboxes}
    />
  );
};

export default BaseInventoryTable;
