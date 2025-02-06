import { FC } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { CustomTable } from '@components/index.ts';
import { WarehouseInventoryDetailExtended } from '../state/warehouseInventoryTypes.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

// Define Column Type explicitly
interface Column<T> {
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  format?: (value: any) => string | number | null | undefined;
}

interface WarehouseInventoryDetailTableProps {
  data: WarehouseInventoryDetailExtended[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const WarehouseInventoryDetailTable: FC<WarehouseInventoryDetailTableProps> = ({
                                                                                 data,
                                                                                 page,
                                                                                 rowsPerPage,
                                                                                 totalRecords,
                                                                                 totalPages,
                                                                                 onPageChange,
                                                                                 onRowsPerPageChange,
                                                                               }) => {
  const transformedData = data.map((row) => ({
    ...row,
    lotUpdatedBy: row.lotUpdated?.by ?? 'Unknown', // Extract "Updated By"
    lotUpdatedDate: row.lotUpdated?.date ?? '', // Extract "Updated Date"
    lotCreatedBy: row.lotCreated?.by ?? 'Unknown', // Extract "Created By"
    lotCreatedDate: row.lotCreated?.date ?? '', // Extract "Created Date"
  }));
  
  // Define table columns
  const columns: Column<WarehouseInventoryDetailExtended>[]  = [
    {
      id: 'productName',
      label: 'Product Name',
      sortable: true,
    },
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
    },
    {
      id: 'lotQuantity',
      label: 'Quantity',
      sortable: true,
    },
    {
      id: 'reservedStock',
      label: 'Reserved Stock',
      sortable: true,
    },
    {
      id: 'lotStatus',
      label: 'Status',
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },
    {
      id: 'manufactureDate',
      label: 'Manufactured Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'inboundDate',
      label: 'Inbound Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'outboundDate',
      label: 'Outbound Date',
      sortable: true,
      format: (value: any) => formatDate(value),
    },
    {
      id: 'warehouseFees',
      label: 'Warehouse Fees ($)',
      sortable: true,
      format: (value: any) => formatCurrency(value),
    },
    {
      id: 'lotCreatedBy',
      label: 'Created By',
      sortable: true,
      format: (value: string) => value || 'Unknown',
    },
    {
      id: 'lotCreatedDate',
      label: 'Created Date',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : 'N/A',
    },
    {
      id: 'lotUpdatedBy',
      label: 'Updated By',
      sortable: true,
      format: (value: string) => value || 'Unknown',
    },
    {
      id: 'lotUpdatedDate',
      label: 'Updated Date',
      sortable: true,
      format: (value: string) => value ? formatDate(value) : 'N/A',
    },
  ];
  
  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h5">Warehouse Inventory Lots</Typography>
      </Paper>
      <CustomTable
        columns={columns}
        data={transformedData}
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

export default WarehouseInventoryDetailTable;
