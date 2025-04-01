import { FC } from 'react';
import { CustomTable } from '@components/index.ts';
import { WarehouseInventory } from '../state/warehouseInventoryTypes.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';

interface WarehouseInventoryTableProps {
  data: WarehouseInventory[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const WarehouseInventoryTable: FC<WarehouseInventoryTableProps> = ({
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
      id: 'warehouse.name',
      label: 'Warehouse',
      sortable: true,
      renderCell: (row: WarehouseInventory) => (
        <Link
          to={`/warehouse_inventories/${row.warehouse.id}`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.warehouse.name}
        </Link>
      ),
    },
    {
      id: 'warehouse.storageCapacity',
      label: 'Storage Capacity',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.warehouse.storageCapacity,
    },
    {
      id: 'warehouse.location',
      label: 'Location',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.warehouse.location,
    },
    {
      id: 'inventory.itemType',
      label: 'Item Type',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        capitalizeFirstLetter(row.inventory.itemType),
    },
    {
      id: 'inventory.itemName',
      label: 'Item Name',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.inventory.itemName,
    },
    {
      id: 'quantity.available',
      label: 'Available Qty',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.quantity.available,
    },
    {
      id: 'quantity.reserved',
      label: 'Reserved Qty',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.quantity.reserved,
    },
    {
      id: 'quantity.inStock',
      label: 'In-Stock Qty',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.quantity.inStock,
    },
    {
      id: 'quantity.totalLot',
      label: 'Total Lot Qty',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.quantity.totalLot,
    },
    {
      id: 'fees.warehouseFee',
      label: 'Warehouse Fee ($)',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        formatCurrency(row.fees.warehouseFee),
    },
    {
      id: 'dates.lastUpdate',
      label: 'Last Update',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        formatDateTime(row.dates.lastUpdate),
    },
    {
      id: 'dates.earliestManufactureDate',
      label: 'Earliest MFG Date',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        row.dates.earliestManufactureDate
          ? formatDateTime(row.dates.earliestManufactureDate)
          : 'N/A',
    },
    {
      id: 'dates.nearestExpiryDate',
      label: 'Nearest Expiry',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        row.dates.nearestExpiryDate
          ? formatDateTime(row.dates.nearestExpiryDate)
          : 'N/A',
    },
    {
      id: 'status.display',
      label: 'Display Status',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        capitalizeFirstLetter(row.status.display),
    },
    {
      id: 'dates.displayStatusDate',
      label: 'Display Status Date',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        formatDateTime(row.dates.displayStatusDate),
    },
    {
      id: 'audit.createdAt',
      label: 'Created At',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        formatDateTime(row.audit.createdAt),
    },
    {
      id: 'audit.updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (_: any, row: WarehouseInventory) =>
        row.audit.updatedAt ? formatDateTime(row.audit.updatedAt) : 'N/A',
    },
    {
      id: 'audit.createdBy',
      label: 'Created By',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.audit.createdBy,
    },
    {
      id: 'audit.updatedBy',
      label: 'Updated By',
      sortable: true,
      format: (_: any, row: WarehouseInventory) => row.audit.updatedBy,
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

export default WarehouseInventoryTable;
