import { FC } from 'react';
import { CustomTable, Typography } from '@components/index.ts';
import { InventoryItem } from '../state/inventoryTypes.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { formatDateTime } from '@utils/dateTimeUtils.ts';
import { Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

interface InventoryTableProps {
  data: InventoryItem[];
  page: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const InventoryTable: FC<InventoryTableProps> = ({
                                                   data,
                                                   page,
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
      format: (value: string, row: InventoryItem) => (
        <Link to={`/inventory/${row.inventory_id}`} style={{ textDecoration: 'none', color: 'blue' }}>
          {value}
        </Link>
      ),
    },
    { id: 'location_name', label: 'Location', sortable: true },
    { id: 'item_type', label: 'Item Type', sortable: true },
    { id: 'lot_number', label: 'Lot Number', sortable: true },
    { id: 'identifier', label: 'Identifier', sortable: false },
    {
      id: 'quantity',
      label: 'Quantity',
      sortable: true,
      align: 'right',
      format: (value: number) => value.toLocaleString(),
    },
    {
      id: 'warehouse_fee',
      label: 'Warehouse Fee ($)',
      sortable: true,
      align: 'right',
      format: (value: number | null) => (value ? value.toFixed(2) : 'N/A'),
    },
    {
      id: 'status_name',
      label: 'Status',
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    {
      id: 'updated_at',
      label: 'Updated At',
      sortable: true,
      format: (value: string) => formatDateTime(value),
    },
    { id: 'created_by', label: 'Created By', sortable: false },
    { id: 'updated_by', label: 'Updated By', sortable: false },
  ];
  
  return (
    <Box>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6">Inventory Records</Typography>
      </Paper>
      
      <CustomTable
        columns={columns}
        data={data}
        page={page}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Box>
  );
};

export default InventoryTable;
