import { useMemo, type FC } from 'react';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import CustomMiniTable, { type MiniColumn } from '@components/common/CustomMiniTable';
import type { InventoryActivityLogEntry } from '@features/report/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface Props {
  data: InventoryActivityLogEntry[];
  loading: boolean;
  error: string;
}

const PermissionLogMiniTable: FC<Props> = ({ data, loading, error }) => {
  const columns = useMemo<MiniColumn<InventoryActivityLogEntry>[]>(() => [
    {
      id: 'skuOrCode',
      label: 'SKU / Code',
      renderCell: (row) =>
        row.batchType === 'product'
          ? row.productInfo?.sku ?? '—'
          : row.packagingMaterialInfo?.code ?? '—',
    },
    {
      id: 'itemName',
      label: 'Item Name',
      renderCell: (row) =>
        row.batchType === 'product'
          ? row.productInfo?.productName ?? '—'
          : row.packagingMaterialInfo?.snapshotName ?? '—',
    },
    {
      id: 'lotNumber',
      label: 'Lot #',
      renderCell: (row) =>
        row.batchType === 'product'
          ? row.productInfo?.lotNumber ?? '—'
          : row.packagingMaterialInfo?.lotNumber ?? '—',
    },
    {
      id: 'quantity',
      label: 'Change',
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
          <CustomTypography variant={"subtitle2"} sx={{ color }}>
            {`${change > 0 ? '+' : ''}${change} (${previous} → ${newQty})`}
          </CustomTypography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => formatLabel(value as string),
    },
    {
      id: 'actionTimestamp',
      label: 'Date',
      format: (value) => formatDateTime(value as string),
    },
  ], []);
  
  const slicedData = data.slice(0, 30); // Show max 30 entries
  
  if (loading) {
    return <Loading message="Loading recent permission logs..." />;
  }
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  return (
    <Box
      sx={{
        '& table': {
          '& td, & th': {
            py: 0.25,
            px: 1,
            fontSize: '0.75rem',
          },
        },
      }}
    >
      <CustomMiniTable
        columns={columns}
        data={slicedData}
        dense
        emptyMessage="No inventory activity log records found."
      />
    </Box>
  );
};

export default PermissionLogMiniTable;
