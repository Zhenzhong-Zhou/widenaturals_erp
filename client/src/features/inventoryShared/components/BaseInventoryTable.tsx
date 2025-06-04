import { type ReactNode, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CustomTable, { type Column } from '@components/common/CustomTable';
import StockLevelChip, {
  type StockLevelChipProps,
} from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip, {
  type ExpirySeverityChipProps,
} from '@features/inventoryShared/components/ExpirySeverityChip';
import type { FlatInventoryRowBase } from '@features/inventoryShared/types/InventorySharedType.ts';

interface BaseInventoryTableProps<T> {
  isLoading: boolean;
  groupedData: Record<string, T[]>;
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandedRowId?: string | null;
  onExpandToggle?: (row: any) => void;
  isRowExpanded?: (row: any) => boolean;
  expandedContent?: (row: any) => ReactNode;
  groupKey: 'location' | 'warehouse';
  getRowData: (record: T) => any;
  getGroupHeaderId: (groupName: string) => string;
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
  expandedRowId,
  onExpandToggle,
  isRowExpanded,
  expandedContent,
  groupKey,
  getRowData,
  getGroupHeaderId,
}: BaseInventoryTableProps<T>) => {
  const quantityId =
    groupKey === 'warehouse' ? 'warehouseQuantity' : 'locationQuantity';
  const quantityLabel =
    groupKey === 'warehouse' ? 'Warehouse QTY' : 'Location QTY';

  const renderStockLevelCell = useCallback(
    <T,>(row: FlatInventoryRowBase<T>) => (
      <StockLevelChip
        stockLevel={row.stockLevel as StockLevelChipProps['stockLevel']}
      />
    ),
    []
  );

  const renderExpirySeverityCell = useCallback(
    <T,>(row: FlatInventoryRowBase<T>) => (
      <ExpirySeverityChip
        severity={row.expirySeverity as ExpirySeverityChipProps['severity']}
      />
    ),
    []
  );

  const columns: Column<FlatInventoryRowBase<T>>[] = [
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
      align: 'center',
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
  ];

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
      getRowProps={(row) =>
        row.isGroupHeader
          ? {
              isGroupHeader: true,
              colSpan: columns.length + 1,
              sx: { fontWeight: 600, fontSize: '1rem' },
            }
          : {}
      }
      expandedContent={expandedContent}
      expandable={!!expandedRowId}
      expandedRowId={expandedRowId}
      getRowId={(row) => row.id}
    />
  );
};

export default BaseInventoryTable;
