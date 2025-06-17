import type { FC } from 'react';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { InventoryActivityLogEntry } from '@features/report/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils.ts';
import DetailsSection from '@components/common/DetailsSection.tsx';
import CustomTypography from '@components/common/CustomTypography.tsx';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

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
  const columns: Column<InventoryActivityLogEntry>[] = [
    {
      id: 'skuOrCode',
      label: 'SKU / Code',
      sortable: true,
      renderCell: (row) =>
        row.batchType === 'product'
          ? row.productInfo?.sku ?? '—'
          : row.packagingMaterialInfo?.code ?? '—',
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
  ];
  
  const renderExpandedContent = (row: InventoryActivityLogEntry) => (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Log Details
      </CustomTypography>
      
      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              {
                label: 'Order Number',
                value: row.order.number,
              },
              {
                label: 'Order Type',
                value: row.order.type,
                format: formatLabel,
              },
              {
                label: 'Order Status',
                value: row.order.status,
                format: formatLabel,
              },
              {
                label: 'Adjustment Type',
                value: row.adjustmentType,
                format: formatLabel,
              },
              {
                label: 'Location / Warehouse',
                value: row.locationName ?? row.warehouseName,
              },
              {
                label: 'Source',
                value: row.source?.type,
                format: formatLabel,
              },
              {
                label: 'Ref ID',
                value: row.source?.refId,
              },
            ]}
          />
        </Grid>
        
        {/* Right column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              {
                label: 'Expiry Date',
                value:
                  row.batchType === 'product'
                    ? row.productInfo?.expiryDate
                    : row.packagingMaterialInfo?.expiryDate,
                format: formatDate,
              },
              {
                label: 'Metadata Source',
                value: row.metadata?.source,
                format: formatLabel,
              },
              {
                label: 'Metadata Scope',
                value: row.metadata?.source_level,
                format: formatLabel,
              },
              {
                label: 'Comments',
                value: row.comments,
              },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
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
      getRowId={(row) => row.id}
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
