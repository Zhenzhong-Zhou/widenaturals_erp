import { type FC, lazy, useCallback } from 'react';
import type {
  LocationInventorySummary,
  LocationInventorySummaryItemDetail
} from '../state';
import Box from '@mui/material/Box';
import StockLevelChip from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventoryShared/components/ExpirySeverityChip';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatLabel } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import ExpandableDetailSection from '@components/common/ExpandableDetailSection';
import { getDetailCacheKey } from '@features/inventoryShared/utils/cacheKeys';

const LocationInventorySummaryDetailTable = lazy(() =>
  import('@features/locationInventory/components/LocationInventorySummaryDetailTable')
);

interface LocationInventorySummaryTableProps {
  data: LocationInventorySummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandedRowId?: string | null;
  onDrillDownToggle?: (rowId: string) => void;
  onRowHover?: (rowId: string) => void;
  detailDataMap?: Record<string, LocationInventorySummaryItemDetail[]>;
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

const LocationInventorySummaryTable: FC<LocationInventorySummaryTableProps> = ({
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
  const renderStockLevelCell = useCallback(
    (row: LocationInventorySummary) => (
      <StockLevelChip stockLevel={row.stockLevel} />
    ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: LocationInventorySummary) => (
      <ExpirySeverityChip severity={row.expirySeverity} />
    ),
    []
  );
  
  const columns: Column<LocationInventorySummary>[] = [
    {
      id: 'typeLabel',
      label: 'Type',
      sortable: true,
      format: (value) => formatLabel(value as string),
    },
    {
      id: 'displayName',
      label: 'Item Name',
      sortable: true,
    },
    {
      id: 'availableQuantity',
      label: 'Available Qty',
      sortable: true,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      sortable: true,
    },
    {
      id: 'totalLotQuantity',
      label: 'Lot Qty',
      sortable: true,
    },
    {
      id: 'totalLots',
      label: 'Total Lots',
      sortable: true,
    },
    {
      id: 'earliestManufactureDate',
      label: 'Earliest MFG',
      sortable: true,
      format: (value) => formatDate(value as string),
    },
    {
      id: 'nearestExpiryDate',
      label: 'Nearest Expiry',
      sortable: true,
      format: (value) => formatDate(value as string),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'stockLevel',
      label: 'Stock Level',
      sortable: true,
      renderCell: renderStockLevelCell,
    },
    {
      id: 'expirySeverity',
      label: 'Expiry Severity',
      sortable: true,
      renderCell: renderExpirySeverityCell,
    },
    ...(onDrillDownToggle
      ? [
        createDrillDownColumn<LocationInventorySummary>(
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
    (row: LocationInventorySummary) => {
      const cacheKey = getDetailCacheKey(row.itemId, detailPage, detailLimit);
      
      return (
        <ExpandableDetailSection
          row={row}
          detailData={detailDataMap?.[cacheKey]}
          detailLoading={detailLoadingMap?.[cacheKey] ?? false}
          detailError={detailErrorMap?.[cacheKey] ?? null}
          detailPage={detailPage}
          detailTotalRecords={detailTotalRecords ?? 0}
          detailTotalPages={detailTotalPages ?? 1}
          detailLimit={detailLimit}
          onPageChange={(newPage) => {
            if (onDetailPageChange) {
              onDetailPageChange(newPage + 1);
            }
          }}
          onRowsPerPageChange={onDetailRowsPerPageChange}
          onRefreshDetail={onRefreshDetail}
          DetailTableComponent={LocationInventorySummaryDetailTable}
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
      onRefreshDetail
    ]
  );
  
  return (
    <Box>
      <CustomTable
        columns={columns}
        data={data}
        page={page}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20, 50, 75, 100]}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable={!!expandedRowId}
        expandedRowId={expandedRowId}
        getRowId={(row) => row.itemId}
        expandedContent={expandedContent}
      />
    </Box>
  );
};

export default LocationInventorySummaryTable;
