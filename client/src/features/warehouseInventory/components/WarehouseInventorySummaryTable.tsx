import { type FC, useCallback } from 'react';
import InventoryStatusChip from '@features/inventoryShared/components/InventoryStatusChip';
import StockLevelChip from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventoryShared/components/ExpirySeverityChip';
import CustomTable, { type Column } from '@components/common/CustomTable';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { formatDate } from '@utils/dateTimeUtils';
import type {
  WarehouseInventoryItemSummary, WarehouseInventorySummaryItemDetails,
} from '@features/warehouseInventory/state';
import { formatLabel } from '@utils/textUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import Skeleton from '@mui/material/Skeleton';
import ErrorMessage from '@components/common/ErrorMessage';
import WarehouseInventorySummaryDetailTable
  from '@features/warehouseInventory/components/WarehouseInventorySummaryDetailTable';
import { CustomButton } from '@components/index.ts';

interface SkuInventorySummaryTableProps {
  data: WarehouseInventoryItemSummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandedRowId?: string | null;
  onDrillDownToggle?: (rowId: string) => void;
  detailDataMap?: Record<string, WarehouseInventorySummaryItemDetails[]>;
  detailLoadingMap?: Record<string, boolean>;
  detailErrorMap?: Record<string, string | null>;
  detailPage: number;
  detailLimit: number;
  detailTotalRecords: number;
  detailTotalPages: number;
  onDetailPageChange: (newPage: number) => void;
  onDetailRowsPerPageChange: (newLimit: number) => void;
  onRefreshDetail: (rowId: string) => void;
}

const WarehouseInventorySummaryTable: FC<SkuInventorySummaryTableProps> = ({
                                                                       data,
                                                                       page,
                                                                       rowsPerPage,
                                                                       totalRecords,
                                                                       totalPages,
                                                                       onPageChange,
                                                                       onRowsPerPageChange,
                                                                       expandedRowId,
                                                                       detailDataMap,
                                                                       detailLoadingMap,
                                                                       detailErrorMap,
                                                                       detailPage,
                                                                       detailLimit,
                                                                       detailTotalRecords,
                                                                       detailTotalPages,
                                                                       onDetailPageChange,
                                                                       onDetailRowsPerPageChange,
                                                                       onDrillDownToggle,
                                                                       onRefreshDetail,
                                                                     }) => {
  const columns: Column<WarehouseInventoryItemSummary>[] = [
    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (_value: any, row?: WarehouseInventoryItemSummary) => formatLabel(row?.itemType)
    },
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      format: (_value: any, row?: WarehouseInventoryItemSummary) =>
        row?.itemType === 'product' ? row.productName : row?.itemName,
    },
    {
      id: 'availableQuantity',
      label: 'Available Qty',
      sortable: true,
    },
    {
      id: 'actualQuantity',
      label: 'Actual Qty',
      sortable: true,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      sortable: true,
    },
    {
      id: 'totalLots',
      label: 'Lots',
      sortable: true,
    },
    {
      id: 'lotQuantity',
      label: 'Lot Qty',
      sortable: true,
    },
    {
      id: 'earliestManufactureDate',
      label: 'Earliest MFG',
      sortable: true,
      format: (value: any) => (value ? formatDate(value) : 'N/A'),
    },
    {
      id: 'nearestExpiryDate',
      label: 'Nearest Expiry',
      sortable: true,
      format: (value: any) => (value ? formatDate(value) : 'N/A'),
    },
    {
      id: 'displayStatus',
      label: 'Status',
      sortable: true,
      renderCell: (row: WarehouseInventoryItemSummary) => (
        <InventoryStatusChip status={row.displayStatus} />
      ),
    },
    {
      id: 'stockLevel',
      label: 'Stock Level',
      sortable: false,
      renderCell: (row: WarehouseInventoryItemSummary) => (
        <StockLevelChip stockLevel={row.stockLevel} />
      ),
    },
    {
      id: 'expirySeverity',
      label: 'Expiry Severity',
      sortable: false,
      renderCell: (row: WarehouseInventoryItemSummary) => (
        <ExpirySeverityChip severity={row.expirySeverity} />
      ),
    },
    ...(onDrillDownToggle
      ? [
        createDrillDownColumn<WarehouseInventoryItemSummary>(
          (row) => onDrillDownToggle(row.itemId),
          (row) => expandedRowId === row.itemId
        ),
      ]
      : []),
  ];
  
  const expandedContent = useCallback(
    (row: WarehouseInventoryItemSummary) => {
      const detailData = detailDataMap?.[row.itemId];
      const detailLoading = detailLoadingMap?.[row.itemId] ?? false;
      const detailError = detailErrorMap?.[row.itemId] ?? null;
      
      if (detailLoading) return <Skeleton height={60} />;
      if (detailError) return <ErrorMessage message={detailError} />;
      if (!detailData?.length)
        return (
          <CustomTypography sx={{ p: 2 }} variant="body2">
            No detail data available.
          </CustomTypography>
        );
      
      return (
        <Box sx={{ p: 2 }}>
          <WarehouseInventorySummaryDetailTable
            data={detailData}
            page={detailPage - 1}
            totalRecords={detailTotalRecords ?? 0}
            totalPages={detailTotalPages ?? 1}
            rowsPerPage={detailLimit}
            onPageChange={(newPage) => onDetailPageChange?.(newPage + 1)}
            onRowsPerPageChange={onDetailRowsPerPageChange}
          />
          {onRefreshDetail && (
            <Box mt={1}>
              <CustomButton size="small" onClick={() => onRefreshDetail(row.itemId)}>
                Refresh Details
              </CustomButton>
            </Box>
          )}
        </Box>
      );
    },
    [detailDataMap, detailLoadingMap, detailErrorMap, onRefreshDetail]
  );
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[20, 50, 75, 100]}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      expandable={!!expandedRowId}
      expandedRowIndex={
        expandedRowId ? data.findIndex((row) => row.itemId === expandedRowId) : null
      }
      expandedContent={expandedContent}
    />
  );
};

export default WarehouseInventorySummaryTable;
