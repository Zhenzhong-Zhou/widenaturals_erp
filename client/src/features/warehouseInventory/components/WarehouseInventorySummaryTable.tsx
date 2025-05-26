import { type FC, lazy, useCallback } from 'react';
import InventoryStatusChip from '@features/inventoryShared/components/InventoryStatusChip';
import StockLevelChip from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventoryShared/components/ExpirySeverityChip';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import type {
  WarehouseInventoryItemSummary, WarehouseInventorySummaryItemDetails,
} from '@features/warehouseInventory/state';
import { formatLabel } from '@utils/textUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import ExpandableDetailSection from '@components/common/ExpandableDetailSection';
import { getDetailCacheKey } from '@features/inventoryShared/utils/cacheKeys';

const WarehouseInventorySummaryDetailTable = lazy(() =>
  import('@features/warehouseInventory/components/WarehouseInventorySummaryDetailTable')
);

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
  onRowHover?: (rowId: string) => void;
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
                                                                       onRowHover,
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
          (row) => onDrillDownToggle?.(row.itemId),
          (row) => expandedRowId === row.itemId,
          {
            onMouseEnter: (row) => onRowHover?.(row.itemId),
          }
        )
      ]
      : []),
  ];
  
  const expandedContent = useCallback(
    (row: WarehouseInventoryItemSummary) => {
      const cacheKey = getDetailCacheKey(row.itemId, detailPage, detailLimit);
      
      return (
        <ExpandableDetailSection
          row={row}
          detailData={detailDataMap?.[cacheKey]}
          detailLoading={detailLoadingMap?.[cacheKey] ?? false}
          detailError={detailErrorMap?.[cacheKey] ?? null}
          detailPage={detailPage}
          detailLimit={detailLimit}
          detailTotalRecords={detailTotalRecords ?? 0}
          detailTotalPages={detailTotalPages ?? 1}
          onPageChange={(newPage) => {
            if (onDetailPageChange) {
              onDetailPageChange(newPage + 1);
            }
          }}
          onRowsPerPageChange={onDetailRowsPerPageChange ?? (() => {})}
          onRefreshDetail={onRefreshDetail}
          DetailTableComponent={WarehouseInventorySummaryDetailTable}
        />
      );
    },
    [
      detailDataMap,
      detailLoadingMap,
      detailErrorMap,
      detailPage,
      detailLimit,
      detailTotalRecords,
      detailTotalPages,
      onDetailPageChange,
      onDetailRowsPerPageChange,
      onRefreshDetail,
    ]
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
      expandedRowId={expandedRowId}
      getRowId={(row) => row.itemId}
      expandedContent={expandedContent}
    />
  );
};

export default WarehouseInventorySummaryTable;
