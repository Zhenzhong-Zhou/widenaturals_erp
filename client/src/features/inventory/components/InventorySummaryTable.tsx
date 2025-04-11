import type { FC } from 'react';
import { Link } from 'react-router-dom';
import InventoryStatusChip from '@features/inventory/components/InventoryStatusChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import type { InventorySummary } from '@features/inventory';

interface InventorySummaryTableProps {
  data: InventorySummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const InventorySummaryTable: FC<InventorySummaryTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const columns = [
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      renderCell: (row: InventorySummary) => (
        <Link
          to={`/products/${row.productId}`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.itemName}
        </Link>
      ),
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
      id: 'recordedQuantity',
      label: 'Recorded Qty',
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
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row: InventorySummary) => (
        <InventoryStatusChip status={row.status} />
      ),
    },
    {
      id: 'stockLevel',
      label: 'Stock Level',
      sortable: false,
      renderCell: (row: InventorySummary) => (
        <StockLevelChip
          stockLevel={row.stockLevel}
          isLowStock={row.isLowStock}
        />
      ),
    },
    {
      id: 'isNearExpiry',
      label: 'Near Expiry',
      sortable: false,
      renderCell: (row: InventorySummary) => (
        <NearExpiryChip isNearExpiry={row.isNearExpiry} />
      ),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 30, 50, 100]}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default InventorySummaryTable;
