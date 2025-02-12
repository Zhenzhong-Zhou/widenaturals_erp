import { FC, ReactNode, useState } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { CustomTable } from '@components/index.ts';
import EditIcon from '@mui/icons-material/Edit';
import { EditQuantityModal } from '../index.ts';
import { WarehouseInventoryDetailExtended } from '../state/warehouseInventoryTypes.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

// Define Column Type explicitly
interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  format?: (value: any, row?: T) => string | number | null | undefined;
  renderCell?: (row: T) => ReactNode;
}

interface WarehouseInventoryDetailTableProps {
  data: WarehouseInventoryDetailExtended[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onQuantityUpdate: (
    warehouseInventoryLotId: string,
    adjustedQuantity: number,
    adjustmentTypeId: string,
    comments: string
  ) => void; // Callback for quantity update
}

const WarehouseInventoryDetailTable: FC<WarehouseInventoryDetailTableProps> = ({
                                                                                 data,
                                                                                 page,
                                                                                 rowsPerPage,
                                                                                 totalRecords,
                                                                                 totalPages,
                                                                                 onPageChange,
                                                                                 onRowsPerPageChange,
                                                                                 onQuantityUpdate,
                                                                               }) => {
  const [selectedLot, setSelectedLot] = useState<{
    warehouseInventoryLotId: string;
    productName: string;
    lotNumber: string;
    quantity: number;
  } | null>(null);
  
  const transformedData = data.map((row) => ({
    ...row,
    lotUpdatedBy: row.lotUpdated?.by ?? 'Unknown', // Extract "Updated By"
    lotUpdatedDate: row.lotUpdated?.date ?? '', // Extract "Updated Date"
    lotCreatedBy: row.lotCreated?.by ?? 'Unknown', // Extract "Created By"
    lotCreatedDate: row.lotCreated?.date ?? '', // Extract "Created Date"
    warehouseInventoryLotId: row.warehouseInventoryLotId, // Ensure this exists
    productName: row.productName, // Ensure this exists
    lotNumber: row.lotNumber, // Ensure this exists
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
      renderCell: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {row.lotQuantity}
          <IconButton
            size="small"
            onClick={() => setSelectedLot({
              warehouseInventoryLotId: row.warehouseInventoryLotId,
              productName: row.productName,
              lotNumber: row.lotNumber,
              quantity: row.lotQuantity,
            })}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
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
      
      {/* Edit Quantity Modal */}
      {selectedLot && (
        <EditQuantityModal
          open={Boolean(selectedLot)}
          onClose={() => setSelectedLot(null)}
          warehouseInventoryLotId={selectedLot.warehouseInventoryLotId}
          productName={selectedLot.productName}
          lotNumber={selectedLot.lotNumber}
          currentQuantity={selectedLot.quantity}
          onSubmit={(data) => {
            onQuantityUpdate(
              data.warehouseInventoryLotId,
              data.adjustedQuantity,
              data.adjustmentType,
              data.comment || ''
            );
            setSelectedLot(null);
          }}
        />
      )}
    </Box>
  );
};

export default WarehouseInventoryDetailTable;
