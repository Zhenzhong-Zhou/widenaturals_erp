import { type FC, useCallback } from 'react';
import type { LocationInventorySummary } from '../state';
import Box from '@mui/material/Box';
import StockLevelChip from '@features/inventoryShared/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventoryShared/components/ExpirySeverityChip';
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
