import type { FC } from 'react';
// import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import InventoryStatusChip from '@features/inventory/components/InventoryStatusChip';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import CustomTable from '@components/common/CustomTable';
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
  const columns = [
    { id: 'placeName', label: 'Place Name', sortable: true },
    
    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (value: string) => formatLabel(value),
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
      format: (value: number) => value ?? 0,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      sortable: true,
      format: (value: number) => value ?? 0,
    },
    {
      id: 'totalLotQuantity',
      label: 'Lot Qty',
      sortable: true,
      format: (value: number) => value ?? 0,
    },
    {
      id: 'displayStatus',
      label: 'Status',
      sortable: true,
      renderCell: (row: InventoryItem) => <InventoryStatusChip status={row.displayStatus} />,
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'earliestManufactureDate',
      label: 'Earliest MFG',
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'nearestExpiryDate',
      label: 'Nearest Expiry',
      sortable: true,
      format: (value: string) => formatDate(value),
    },
    {
      id: 'warehouseFee',
      label: 'Storage Fee',
      sortable: true,
      format: (value: number) => formatCurrency(value),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    { id: 'createdBy', label: 'Created By', sortable: false },
    { id: 'updatedBy', label: 'Updated By', sortable: false },
    
    {
      id: 'isExpired',
      label: 'Expired',
      sortable: true,
      renderCell: (row: InventoryItem) => <IsExpiredChip isExpired={row.isExpired} />,
    },
    {
      id: 'isNearExpiry',
      label: 'Near Expiry',
      sortable: true,
      renderCell: (row: InventoryItem) => <NearExpiryChip isNearExpiry={row.isNearExpiry} />,
    },
    {
      id: 'stockLevel',
      label: 'Stock Level',
      sortable: true,
      renderCell: (row: InventoryItem) => (
        <StockLevelChip stockLevel={row.stockLevel} isLowStock={row.isLowStock} />
      ),
    },
    {
      id: 'expirySeverity',
      label: 'Expiry Severity',
      sortable: true,
      renderCell: (row: InventoryItem) => <ExpirySeverityChip severity={row.expirySeverity} />,
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
