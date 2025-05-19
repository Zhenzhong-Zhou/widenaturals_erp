import type { FC } from 'react';
import { Link } from 'react-router-dom';
import InventoryStatusChip from '@features/locationInventory/components/InventoryStatusChip.tsx';
import StockLevelChip from '@features/locationInventory/components/StockLevelChip.tsx';
import ExpirySeverityChip from '@features/locationInventory/components/ExpirySeverityChip.tsx';
import CustomTable, { type Column } from '@components/common/CustomTable.tsx';
import { formatDate } from '@utils/dateTimeUtils.ts';
import type {
  WarehouseInventoryItemSummary,
} from '@features/warehouseInventory/state';

interface SkuInventorySummaryTableProps {
  data: WarehouseInventoryItemSummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const WarehouseInventorySummaryTable: FC<SkuInventorySummaryTableProps> = ({
                                                                       data,
                                                                       page,
                                                                       rowsPerPage,
                                                                       totalRecords,
                                                                       totalPages,
                                                                       onPageChange,
                                                                       onRowsPerPageChange,
                                                                     }) => {
  const columns: Column<WarehouseInventoryItemSummary>[] = [
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      renderCell: (row: WarehouseInventoryItemSummary) =>
        row.itemType === 'product' ? (
          <Link
            to={`/skus/${row.itemId}`}
            style={{ textDecoration: 'none', color: 'blue' }}
          >
            {row.productName}
          </Link>
        ) : (
          row.itemName
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
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[20, 30, 40, 50]}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default WarehouseInventorySummaryTable;
