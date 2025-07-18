import { type FC, lazy, Suspense, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CustomTypography from '@components/common/CustomTypography';
import CustomTable, { type Column } from '@components/common/CustomTable';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import type { InventoryActivityLogEntry } from '@features/report/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

const InventoryActivityLogExpandedContent = lazy(
  () => import('./InventoryActivityLogExpandedContent')
);

interface InventoryActivityLogTableProps {
  data: InventoryActivityLogEntry[];
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
  onExpandToggle?: (row: InventoryActivityLogEntry) => void;
  isRowExpanded?: (row: InventoryActivityLogEntry) => boolean;
}

const InventoryActivityLogsTable: FC<InventoryActivityLogTableProps> = ({
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
  const getRowId = useCallback((row: InventoryActivityLogEntry) => row.id, []);

  const columns = useMemo<Column<InventoryActivityLogEntry>[]>(
    () => [
      {
        id: 'skuOrCode',
        label: 'SKU / Code',
        sortable: true,
        renderCell: (row) =>
          row.batchType === 'product'
            ? (row.productInfo?.sku ?? '—')
            : (row.packagingMaterialInfo?.code ?? '—'),
      },
      {
        id: 'batchType',
        label: 'Batch Type',
        sortable: true,
        format: (value) => formatLabel(value as string),
      },
      {
        id: 'itemName',
        label: 'Item Name',
        sortable: true,
        renderCell: (row) =>
          row.batchType === 'product'
            ? (row.productInfo?.productName ?? '—')
            : (row.packagingMaterialInfo?.snapshotName ?? '—'),
      },
      {
        id: 'lotNumber',
        label: 'Lot #',
        renderCell: (row) =>
          row.batchType === 'product'
            ? (row.productInfo?.lotNumber ?? '—')
            : (row.packagingMaterialInfo?.lotNumber ?? '—'),
      },
      {
        id: 'quantity',
        label: 'Quantity Change',
        renderCell: (row) => {
          const { change, previous, new: newQty } = row.quantity;
          const isIncrease = change > 0;
          const isDecrease = change < 0;

          const color = isIncrease
            ? 'success.main'
            : isDecrease
              ? 'error.main'
              : 'text.secondary';

          return (
            <CustomTypography sx={{ color }}>
              {`${change > 0 ? '+' : ''}${change} (${previous} → ${newQty})`}
            </CustomTypography>
          );
        },
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        format: (value) => formatLabel(value as string),
      },
      {
        id: 'actionTimestamp',
        label: 'Action Date',
        sortable: true,
        format: (value) => formatDateTime(value as string),
      },
      {
        id: 'performedBy',
        label: 'Performed By',
        sortable: true,
      },
      {
        id: 'actionType',
        label: 'Action Type',
        sortable: true,
        format: (value) => formatLabel(value as string),
      },
      {
        id: 'expand',
        label: '',
        align: 'center',
        renderCell: (row) => (
          <IconButton onClick={() => onExpandToggle?.(row)}>
            {isRowExpanded?.(row) ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        ),
      },
    ],
    [onExpandToggle, isRowExpanded]
  );

  const renderExpandedContent = useCallback(
    (row: InventoryActivityLogEntry) => (
      <Suspense
        fallback={<SkeletonExpandedRow showSummary={false} fieldPairs={3} />}
      >
        <InventoryActivityLogExpandedContent row={row} />
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
      rowsPerPageOptions={[25, 50, 75, 100]}
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

export default InventoryActivityLogsTable;
