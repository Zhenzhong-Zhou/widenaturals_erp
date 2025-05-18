import { type FC, useCallback } from 'react';
import type { LocationInventorySummary } from '../state';
import Box from '@mui/material/Box';
import InventoryStatusChip from '@features/locationInventory/components/InventoryStatusChip';
import IsExpiredChip from '@features/locationInventory/components/IsExpiredChip';
import NearExpiryChip from '@features/locationInventory/components/NearExpiryChip';
import StockLevelChip from '@features/locationInventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/locationInventory/components/ExpirySeverityChip';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatLabel } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';

interface LocationInventorySummaryTableProps {
  data: LocationInventorySummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const LocationInventorySummaryTable: FC<LocationInventorySummaryTableProps> = ({
                                                                 data,
                                                                 page,
                                                                 rowsPerPage,
                                                                 totalRecords,
                                                                 totalPages,
                                                                 onPageChange,
                                                                 onRowsPerPageChange,
                                                               }) => {
  const renderStatusCell = useCallback(
    (row: LocationInventorySummary) => <InventoryStatusChip status={row.displayStatus} />,
    []
  );
  
  const renderIsExpiredCell = useCallback(
    (row: LocationInventorySummary) => <IsExpiredChip isExpired={row.isExpired} />,
    []
  );
  
  const renderNearExpiryCell = useCallback(
    (row: LocationInventorySummary) => <NearExpiryChip isNearExpiry={row.isNearExpiry} />,
    []
  );
  
  const renderStockLevelCell = useCallback(
    (row: LocationInventorySummary) => (
      <StockLevelChip stockLevel={row.stockLevel} isLowStock={row.isLowStock} />
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
      id: 'locationName',
      label: 'Location',
      sortable: true,
    },
    {
      id: 'batchType',
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
      id: 'lotNumber',
      label: 'Lot Number',
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
      id: 'displayStatus',
      label: 'Status',
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      id: 'status.date',
      label: 'Status Date',
      sortable: true,
      format: (_, row) => formatDate(row?.status?.date ?? ''),
    },
    {
      id: 'manufactureDate',
      label: 'MFG Date',
      sortable: true,
      format: (value) => formatDate(value as string),
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      format: (value) => formatDate(value as string),
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
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'isExpired',
      label: 'Expired',
      sortable: true,
      renderCell: renderIsExpiredCell,
    },
    {
      id: 'isNearExpiry',
      label: 'Near Expiry',
      sortable: true,
      renderCell: renderNearExpiryCell,
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
  ];
  
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
      />
    </Box>
  );
};

export default LocationInventorySummaryTable;
