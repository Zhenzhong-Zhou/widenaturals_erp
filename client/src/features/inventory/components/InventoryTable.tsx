import { type FC, useCallback } from 'react';
// import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import InventoryStatusChip from '@features/inventory/components/InventoryStatusChip';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { InventoryItem } from '@features/inventory';
import { formatLabel, formatCurrency } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';

interface InventoryTableProps {
  data: InventoryItem[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const InventoryTable: FC<InventoryTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const renderStatusCell = useCallback(
    (row: InventoryItem) => <InventoryStatusChip status={row.displayStatus} />,
    []
  );
  
  const renderIsExpiredCell = useCallback(
    (row: InventoryItem) => <IsExpiredChip isExpired={row.isExpired} />,
    []
  );
  
  const renderNearExpiryCell = useCallback(
    (row: InventoryItem) => <NearExpiryChip isNearExpiry={row.isNearExpiry} />,
    []
  );
  
  const renderStockLevelCell = useCallback(
    (row: InventoryItem) => (
      <StockLevelChip
        stockLevel={row.stockLevel}
        isLowStock={row.isLowStock}
      />
    ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: InventoryItem) => (
      <ExpirySeverityChip severity={row.expirySeverity} />
    ),
    []
  );
  
  const columns: Column<InventoryItem>[] = [
    { id: 'placeName', label: 'Place Name', sortable: true },

    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (value) => formatLabel(value as string),
    },
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      // renderCell: (row: InventoryItem) => (
      //   <Link
      //     to={`/inventory/${row.inventoryId}`}
      //     style={{ textDecoration: 'none', color: 'blue' }}
      //   >
      //     {row.itemName}
      //   </Link>
      // ),
    },
    {
      id: 'availableQuantity',
      label: 'Available Qty',
      sortable: true,
      format: (value) => value as number ?? 0,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      sortable: true,
      format: (value) => value as number ?? 0,
    },
    {
      id: 'totalLotQuantity',
      label: 'Lot Qty',
      sortable: true,
      format: (value) => value as number ?? 0,
    },
    {
      id: 'displayStatus',
      label: 'Status',
      sortable: true,
      renderCell: renderStatusCell,
    },
    {
      id: 'statusDate',
      label: 'Status Date',
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
      id: 'warehouseFee',
      label: 'Storage Fee',
      sortable: true,
      format: (value) => formatCurrency(value as number),
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
    { id: 'createdBy', label: 'Created By', sortable: false },
    { id: 'updatedBy', label: 'Updated By', sortable: false },

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
        rowsPerPageOptions={[10, 30, 50, 100]}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};

export default InventoryTable;
