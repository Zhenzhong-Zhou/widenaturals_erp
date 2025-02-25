import { FC, ReactNode, useState } from 'react';
import { Box, Paper, IconButton, Checkbox } from '@mui/material';
import { CustomButton, CustomTable, Typography } from '@components/index.ts';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory'; // Ensure this import exists
import { BulkAdjustQuantityModal, EditQuantityModal } from '../index.ts';
import { WarehouseInventoryDetailExtended } from '../state/warehouseInventoryTypes.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import BulkInsertInventoryModal from './BulkInsertInventoryModal.tsx';

// Define Column Type explicitly
interface Column<T> {
  id: keyof T | 'actions' | 'select';
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
  onSingleLotQuantityUpdate: (
    warehouseInventoryLotId: string,
    adjustedQuantity: number,
    adjustmentTypeId: string,
    comments: string
  ) => void; // Callback for quantity update
  onBulkLotsQtyUpdate: (
    bulkData: {
      warehouse_inventory_id: string;
      adjustment_type_id: string;
      adjusted_quantity: number;
      comments: string;
    }[]
  ) => void;
  warehouseId: string;
  handleBulkInsertSubmit: (formData: Record<string, any>[]) => Promise<void>;
}

const WarehouseInventoryDetailTable: FC<WarehouseInventoryDetailTableProps> = ({
  data,
  page,
  rowsPerPage,
  totalRecords,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
  onSingleLotQuantityUpdate,
  onBulkLotsQtyUpdate,
  warehouseId,
  handleBulkInsertSubmit,
}) => {
  const [selectedLot, setSelectedLot] = useState<{
    warehouseInventoryLotId: string;
    productName: string;
    lotNumber: string;
    quantity: number;
  } | null>(null);

  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [selectedLots, setSelectedLots] = useState<
    {
      warehouseInventoryLotId: string;
      productName: string;
      lotNumber: string;
      currentQuantity: number;
    }[]
  >([]);

  const transformedData = data.map((row) => ({
    ...row,
    isSelect: false,
    lotUpdatedBy: row.lotUpdated?.by ?? 'Unknown', // Extract "Updated By"
    lotUpdatedDate: row.lotUpdated?.date ?? '', // Extract "Updated Date"
    lotCreatedBy: row.lotCreated?.by ?? 'Unknown', // Extract "Created By"
    lotCreatedDate: row.lotCreated?.date ?? '', // Extract "Created Date"
    warehouseInventoryLotId: row.warehouseInventoryLotId, // Ensure this exists
    productName: row.productName, // Ensure this exists
    lotNumber: row.lotNumber, // Ensure this exists
  }));

  const handleSelectLot = (lotId: string) => {
    setSelectedLotIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(lotId)) {
        newSelected.delete(lotId);
      } else {
        newSelected.add(lotId);
      }
      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    setSelectedLotIds((prevSelected) => {
      if (prevSelected.size === data.length) {
        return new Set(); // Unselect all
      }
      return new Set(data.map((lot) => lot.warehouseInventoryLotId)); // Select all
    });
  };

  // Define table columns
  const columns: Column<WarehouseInventoryDetailExtended>[] = [
    // 1️⃣ Selection Checkbox
    {
      id: 'select',
      label: 'Select',
      renderCell: (row) => (
        <Checkbox
          checked={selectedLotIds.has(row.warehouseInventoryLotId)}
          onChange={() => handleSelectLot(row.warehouseInventoryLotId)}
          color="primary"
        />
      ),
    },

    // 2️⃣ Product & Lot Identification
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
      id: 'identifier',
      label: 'Identifier',
      sortable: true,
      format: (value: any) => value || 'N/A',
    },
    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (value: any) => capitalizeFirstLetter(value),
    },

    // 3️⃣ Stock & Warehouse Information
    {
      id: 'lotQuantity',
      label: 'Quantity',
      sortable: true,
      renderCell: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {row.lotQuantity}
          <IconButton
            size="small"
            onClick={() =>
              setSelectedLot({
                warehouseInventoryLotId: row.warehouseInventoryLotId,
                productName: row.productName,
                lotNumber: row.lotNumber,
                quantity: row.lotQuantity,
              })
            }
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
      id: 'availableStock',
      label: 'Available Stock',
      sortable: true,
    },
    {
      id: 'lotStatus',
      label: 'Status',
      sortable: true,
      format: (value: string) => capitalizeFirstLetter(value),
    },

    // 4️⃣ Date Tracking (Manufacturing, Expiry, Inbound & Outbound)
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
      format: (value: any) => (value ? formatDate(value) : 'N/A'),
    },

    // 5️⃣ Warehouse Fees
    {
      id: 'warehouseFees',
      label: 'Warehouse Fees ($)',
      sortable: true,
      format: (value: any) => formatCurrency(value),
    },

    // 6️⃣ User & System Tracking
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
      format: (value: string) => (value ? formatDate(value) : 'N/A'),
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
      format: (value: string) => (value ? formatDate(value) : 'N/A'),
    },
  ];

  return (
    <Box>
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Checkbox
          checked={
            selectedLotIds.size > 0 && selectedLotIds.size === data.length
          }
          onChange={toggleSelectAll}
          color="primary"
        />
        Select All
        <Typography variant="h5">Warehouse Inventory Lots</Typography>
        
        {/* Pass handleBulkInsertSubmit function to modal */}
        <BulkInsertInventoryModal warehouseId={warehouseId} onSubmit={handleBulkInsertSubmit} mode={'create'} />
        
        <CustomButton
          variant="contained"
          color="primary"
          startIcon={<InventoryIcon />}
          onClick={() => {
            const selected = data
              .filter((lot) => selectedLotIds.has(lot.warehouseInventoryLotId))
              .map((lot) => ({
                warehouseInventoryLotId: lot.warehouseInventoryLotId,
                productName: lot.productName,
                lotNumber: lot.lotNumber,
                currentQuantity: lot.lotQuantity || 0,
              }));

            if (selected.length === 0) {
              alert('Please select at least one lot.');
              return;
            }

            setSelectedLots(selected);
            setBulkAdjustOpen(true);
          }}
          sx={{ marginTop: 2 }}
        >
          Bulk Adjust Quantities
        </CustomButton>
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
            onSingleLotQuantityUpdate(
              data.warehouseInventoryLotId,
              data.adjustedQuantity,
              data.adjustmentType,
              data.comment || ''
            );
            setSelectedLot(null);
          }}
        />
      )}

      {/* Bulk Adjust Quantity Modal */}
      <BulkAdjustQuantityModal
        open={bulkAdjustOpen}
        onClose={() => setBulkAdjustOpen(false)}
        selectedLots={selectedLots}
        onSubmit={(bulkData) => {
          onBulkLotsQtyUpdate(bulkData);
          setSelectedLots([]);
        }}
      />
    </Box>
  );
};

export default WarehouseInventoryDetailTable;
