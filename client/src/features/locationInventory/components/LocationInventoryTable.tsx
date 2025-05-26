import { type FC, type ReactNode, useCallback } from 'react';
import type { FlatLocationInventoryRow, LocationInventoryRecord } from '../state';
import { formatDate, timeAgo } from '@utils/dateTimeUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { formatLabel } from '@utils/textUtils.ts';
import StockLevelChip, {
  type StockLevelChipProps
} from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip, {
  type ExpirySeverityChipProps,
} from '@features/inventoryShared/components/ExpirySeverityChip';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface LocationInventoryTableProps {
  isLoading: boolean;
  groupedData: Record<string, LocationInventoryRecord[]>;
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandedRowId?: string | null;
  onExpandToggle?: (row: FlatLocationInventoryRow) => void;
  isRowExpanded?: (row: FlatLocationInventoryRow) => boolean;
  expandedContent?: (row: FlatLocationInventoryRow) => ReactNode;
}

/**
 * Renders a table for location inventory records using CustomTable.
 */
const LocationInventoryTable: FC<LocationInventoryTableProps> = ({
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
                                                                 }) => {
  const renderStockLevelCell = useCallback(
    (row: FlatLocationInventoryRow) => (
      <StockLevelChip stockLevel={row.stockLevel as StockLevelChipProps['stockLevel']} />
    ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: FlatLocationInventoryRow) => (
      <ExpirySeverityChip severity={row.expirySeverity as ExpirySeverityChipProps['severity']} />
    ),
    []
  );
  
  const columns: Column<FlatLocationInventoryRow>[] = [
    { id: 'name', label: 'Name' },
    { id: 'lotNumber', label: 'Lot #' },
    { id: 'expiryDate', label: 'Expiry Date' },
    { id: 'locationQuantity', label: 'Location QTY' },
    { id: 'available', label: 'Available' },
    { id: 'reserved', label: 'Reserved' },
    { id: 'lastUpdate', label: 'Last Update' },
    { id: 'status', label: 'Status' },
    { id: 'stockLevel', label: 'Stock Level', renderCell: renderStockLevelCell, },
    {
      id: 'expirySeverity',
      label: 'Expiry Severity',
      renderCell: renderExpirySeverityCell
    },
    {
      id: 'expand',
      label: '',
      align: 'center',
      renderCell: (row) =>
        row.isGroupHeader ? null : (
          <IconButton onClick={() => onExpandToggle?.(row)}>
            {isRowExpanded?.(row) ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        ),
    }
  ];
  
  // Flatten with group headers
  const flattenedWithHeaders: FlatLocationInventoryRow[] = [];
  
  Object.entries(groupedData).forEach(([locationName, records]) => {
    // Insert a synthetic group header row
    flattenedWithHeaders.push({
      id: `group-${locationName}`,
      location: locationName,
      name: `-- ${locationName} --`,
      lotNumber: '',
      locationQuantity: 0,
      available: 0,
      reserved: 0,
      status: '',
      stockLevel: '',
      expirySeverity: '',
      expiryDate: '',
      lastUpdate: '',
      isGroupHeader: true,
      itemType: 'Material', // Just to satisfy type; won't be rendered
    } as any); // Cast if needed
    
    records.forEach((item) => {
      flattenedWithHeaders.push({
        id: item.id,
        lotNumber: item.lot?.number ?? '-',
        name: item.display.name,
        locationQuantity: item.quantity.locationQuantity ?? 0,
        available: item.quantity.available ?? 0,
        reserved: item.quantity.reserved ?? 0,
        status: formatLabel(item.status?.name) ?? '-',
        stockLevel: item.status?.stockLevel ?? '-',
        expirySeverity: item.status?.expirySeverity ?? '-',
        expiryDate: item.lot?.expiryDate ? formatDate(item.lot.expiryDate) : '-',
        lastUpdate: item.timestamps?.lastUpdate ? timeAgo(item.timestamps.lastUpdate) : '-',
        originalRecord: item,
      });
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
      getRowProps={(row) =>
        row.isGroupHeader
          ? {
            isGroupHeader: true,
            colSpan: columns.length + 1,
            sx: {
              fontWeight: 600,
              fontSize: '1rem',
            },
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

export default LocationInventoryTable;
