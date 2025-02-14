import { FC } from 'react';
import { CustomTable } from '@components/index.ts';
import { InventoryItem } from '../state/inventoryTypes.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils.ts';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';

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
    {
      id: 'product_name',
      label: 'Product Name',
      sortable: true,
      format: (value: any) => value,
      renderCell: (row: Record<string, any>) => (
        <Link
          to={`/inventory/${row.inventory_id || 'unknown'}`}
          style={{ textDecoration: 'none', color: 'blue' }}
        >
          {row.product_name}
        </Link>
      ),
    },
    { id: 'location_name', label: 'Location', sortable: true },
    { id: 'warehouse_name', label: 'Warehouse', sortable: true },
    {
      id: 'item_type',
      label: 'Item Type',
      sortable: true,
      format: (value: any) => capitalizeFirstLetter(value),
    },
    { id: 'identifier', label: 'Identifier', sortable: false },
    {
      id: 'available_quantity',
      label: 'Available Quantity',
      sortable: true,
      format: (value: any) => value,
    },
    {
      id: 'reserved_quantity',
      label: 'Reserved Quantity',
      sortable: true,
      format: (value: any) => value,
    },
    {
      id: 'total_lot_quantity',
      label: 'Total Lot Quantity',
      sortable: true,
      format: (value: any) => value,
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value: any) => capitalizeFirstLetter(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'earliest_manufacture_date',
      label: 'Earliest Manufacture Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'nearest_expiry_date',
      label: 'Nearest Expiry Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'warehouse_fee',
      label: 'Storage Fee',
      sortable: true,
      format: (value: any) => `$${value.toFixed(2)}`,
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: any) => formatDateTime(value),
    },
    { id: 'created_by', label: 'Created By', sortable: false },
    { id: 'updated_by', label: 'Updated By', sortable: false },
    {
      id: 'is_expired',
      label: 'Expired',
      sortable: false,
      format: (value: boolean) => (value ? 'Yes' : 'No'),
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

export default InventoryTable;
