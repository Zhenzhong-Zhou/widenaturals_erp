import { type FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import {
  ErrorMessage,
  Loading,
  NoDataFound,
  TruncatedText,
} from '@components/index';
import CustomMiniTable, {
  type MiniColumn,
} from '@components/common/CustomMiniTable';
import { useInventoryActivityLog } from '@hooks/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import { usePaginationHandlers } from '@utils/hooks';
import { formatLabel } from '@utils/textUtils';
import type { InventoryActivityLogRecord } from '@features/warehouseInventory/state';

type WarehouseInventoryActivityLogPanelProps = {
  warehouseId: string;
  warehouseInventoryId: string;
};

const formatQuantityChange = (change: number) =>
  change > 0 ? `+${change.toLocaleString()}` : change.toLocaleString();

const quantityChangeColor = (change: number) =>
  change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';

const columns: MiniColumn<InventoryActivityLogRecord>[] = [
  {
    id: 'performedAt',
    label: 'When',
    format: (value) => formatDateTime(value as string) ?? '—',
  },
  {
    id: 'adjustmentTypeName',
    label: 'Adjustment type',
    renderCell: (row) => formatLabel(row.adjustmentTypeName),
  },
  {
    id: 'actionTypeName',
    label: 'Action',
    renderCell: (row) => formatLabel(row.actionTypeName),
  },
  {
    id: 'previousQuantity',
    label: 'Previous quantity',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
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
    label: 'New qty',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
  },
  {
    id: 'performedByName',
    label: 'By',
    format: (value) => (value as string | null) ?? '—',
  },
  {
    id: 'reference',
    label: 'Reference',
    renderCell: (row) =>
      row.referenceType
        ? `${row.referenceType} · ${row.referenceId ?? '—'}`
        : '—',
  },
  {
    id: 'comments',
    label: 'Comments',
    renderCell: (row) =>
      row.comments ? <TruncatedText text={row.comments} maxLength={40} /> : '—',
  },
];

const WarehouseInventoryActivityLogPanel: FC<
  WarehouseInventoryActivityLogPanelProps
> = ({ warehouseId, warehouseInventoryId }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const {
    data,
    loading,
    error,
    totalRecords,
    isEmpty,
    fetchActivityLog,
    resetActivityLog,
  } = useInventoryActivityLog();
  
  useEffect(() => {
    fetchActivityLog({
      warehouseId,
      page,
      limit,
      filters: { inventoryId: warehouseInventoryId },
    });
    return () => {
      resetActivityLog();
    };
  }, [warehouseId, warehouseInventoryId, page, limit]);
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  if (loading) {
    return <Loading variant="dotted" message="Loading activity log..." />;
  }
  if (error) {
    return <ErrorMessage message={error} />;
  }
  if (isEmpty) {
    return <NoDataFound message="No activity recorded yet." />;
  }
  
  return (
    <CustomMiniTable<InventoryActivityLogRecord>
      columns={columns}
      data={data}
      page={page - 1}
      initialRowsPerPage={limit}
      totalRecords={totalRecords}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      emptyMessage="No activity recorded yet."
    />
  );
};

export default WarehouseInventoryActivityLogPanel;
