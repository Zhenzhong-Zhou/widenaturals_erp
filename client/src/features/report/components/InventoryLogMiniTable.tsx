import { type FC, Suspense, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CustomTable, { type Column } from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import type { MergedInventoryActivityLogEntry } from '@features/report/utils/logUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import InventoryLogMiniExpandedContent from '@features/report/components/InventoryLogMiniExpandedContent';

interface InventoryLogMiniTableProps {
  data: MergedInventoryActivityLogEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  expandedRowId?: string | number | null;
  onExpandToggle?: (row: MergedInventoryActivityLogEntry) => void;
  isRowExpanded?: (row: MergedInventoryActivityLogEntry) => boolean;
}

const InventoryLogMiniTable: FC<InventoryLogMiniTableProps> = ({
                                            data,
                                            loading,
                                            page,
                                            totalPages,
                                            totalRecords,
                                            rowsPerPage,
                                            onPageChange,
                                            onRowsPerPageChange,
                                            selectedRowIds,
                                            onSelectionChange,
                                            expandedRowId,
                                            onExpandToggle,
                                            isRowExpanded,
                                          }) => {
  const getRowId = useCallback((row: MergedInventoryActivityLogEntry) => row.id, []);
  
  const columns = useMemo<Column<MergedInventoryActivityLogEntry>[]>(() => [
    {
      id: 'actionType',
      label: 'Action Type',
      format: (val) => formatLabel(val as string),
    },
    {
      id: 'quantity',
      label: 'Quantity Change',
      renderCell: (row) => {
        const { change, previous, new: newQty } = row.quantity;
        const color =
          change > 0 ? 'success.main' :
            change < 0 ? 'error.main' :
              'text.secondary';
        return (
          <CustomTypography variant={'subtitle1'} sx={{ color }}>
            {`${change > 0 ? '+' : ''}${change} (${previous} → ${newQty})`}
          </CustomTypography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      format: (val) => formatLabel(val as string),
    },
    {
      id: 'actionTimestamp',
      label: 'Date',
      format: (val) => formatDateTime(val as string),
    },
    {
      id: 'performedBy',
      label: 'Performed By',
      format: (val) => formatLabel(val as string),
    },
    {
      id: 'expand',
      label: '',
      align: 'center',
      renderCell: (row) =>
        (
          <IconButton onClick={() => onExpandToggle?.(row)}>
            {isRowExpanded?.(row) ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        ),
    },
  ], [onExpandToggle, isRowExpanded]);
  
  const renderExpandedContent = useCallback(
    (row: MergedInventoryActivityLogEntry) => (
      <Suspense fallback={<SkeletonExpandedRow />}>
        <InventoryLogMiniExpandedContent row={row} />
      </Suspense>
    ),
    []
  );
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[25, 50, 75]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      getRowId={getRowId}
      selectedRowIds={selectedRowIds}
      onSelectionChange={onSelectionChange}
      expandable={isRowExpanded}
      expandedRowId={expandedRowId}
      expandedContent={renderExpandedContent}
      emptyMessage="No inventory activity logs found."
    />
  );
};

export default InventoryLogMiniTable;
