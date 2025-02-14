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
      id: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      format: (value: any) => value,
      renderCell: (row: WarehouseInventory) => (
        <Link
          to={`/warehouse_inventories/${row.warehouseId}/inventory_records`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.warehouseName}
        </Link>
      ),
    },
    {
      id: 'locationName',
      label: 'Location',
      sortable: true
    },
    {
      id: 'productName',
      label: 'Product Name',
      sortable: true
    
    },
    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (value: any) => capitalizeFirstLetter(value) || 'N/A',
    },
    {
      id: 'identifier',
      label: 'Identifier',
      sortable: true,
      format: (value: any) => value || 'N/A',
    },
    {
      id: 'availableQuantity',
      label: 'Available Qty',
      sortable: true,
      format: (value: any) => value ?? 0,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      sortable: true,
      format: (value: any) => value ?? 0,
    },
    {
      id: 'warehouseFee',
      label: 'Warehouse Fee ($)',
      sortable: true,
      format: (value: string | number) => (value ? `${formatCurrency(value)}` : 'N/A'),
    },
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      format: (value: any) => capitalizeFirstLetter(value),
    },
    {
      id: 'lastUpdate',
      label: 'Last Update',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      sortable: true
    },
    {
      id: 'updatedBy',
      label: 'Updated By',
      sortable: true
    },
  ];
  
  return (
    <Box>
      <CustomTable
        columns={columns}
        data={data}
        page={page}
        initialRowsPerPage={rowsPerPage}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};

export default WarehouseInventoryTable;
