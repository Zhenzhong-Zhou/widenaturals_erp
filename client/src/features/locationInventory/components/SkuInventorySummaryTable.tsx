import type { FC } from 'react';
import { Link } from 'react-router-dom';
import InventoryStatusChip from '@features/locationInventory/components/InventoryStatusChip';
import StockLevelChip from '@features/locationInventory/components/StockLevelChip';
import NearExpiryChip from '@features/locationInventory/components/NearExpiryChip';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import type { BaseWarehouseInventoryItemSummary } from '@features/warehouseInventory/state';

interface SkuInventorySummaryTableProps {
  data: BaseWarehouseInventoryItemSummary[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const SkuInventorySummaryTable: FC<SkuInventorySummaryTableProps> = ({
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
      id: 'productName',
      label: 'Product Name',
      sortable: true,
      renderCell: (row: BaseWarehouseInventoryItemSummary) => (
        <Link
          to={`/skus/${row.skuId}`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.productName}
        </Link>
      ),
    },
    {
      id: 'sku',
      label: 'SKU',
      sortable: true,
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
      renderCell: (row: BaseWarehouseInventoryItemSummary) => (
        <InventoryStatusChip status={row.status} />
      ),
    },
    {
      id: 'stockLevel',
      label: 'Stock Level',
      sortable: false,
      renderCell: (row: BaseWarehouseInventoryItemSummary) => (
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
      renderCell: (row: BaseWarehouseInventoryItemSummary) => (
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
      rowsPerPageOptions={[20, 30, 40, 50]}
      totalPages={totalPages}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default SkuInventorySummaryTable;
