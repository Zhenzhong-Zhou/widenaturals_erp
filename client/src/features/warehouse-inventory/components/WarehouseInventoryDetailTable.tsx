import { FC, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuItem from '@mui/material/MenuItem';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import Typography from '@components/common/Typography';
import CustomButton from '@components/common/CustomButton';
import BulkInsertInventoryModal from '@features/warehouse-inventory/components/BulkInsertInventoryModal';
import InsertedInventoryRecordsResponseDialog
  from '@features/warehouse-inventory/components/InsertedInventoryRecordsResponseDialog';
import CustomTable from '@components/common/CustomTable';
import EditQuantityModal from '@features/warehouse-inventory/components/EditQuantityModal';
import BulkAdjustQuantityModal from '@features/warehouse-inventory/components/BulkAdjustQuantityModal';
import { WarehouseInventoryDetailExtended, WarehouseInventoryInsertResponse } from '@features/warehouse-inventory';
import { formatLabel, formatCurrency } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import {
  handleAdjustmentReportRedirect,
  handleInventoryActivityLogRedirect,
  handleInventoryHistoryRedirect,
} from '@utils/navigationUtils';

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
  insertedDataResponse?: WarehouseInventoryInsertResponse | null;
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
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
  insertedDataResponse,
  openDialog,
  setOpenDialog,
}) => {
  const [selectedLot, setSelectedLot] = useState<{
    warehouseInventoryLotId: string;
    itemName: string;
    lotNumber: string;
    quantity: number;
  } | null>(null);
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [bulkInsertOpen, setBulkInsertOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLots, setSelectedLots] = useState<
    {
      warehouseInventoryLotId: string;
      itemName: string;
      lotNumber: string;
      currentQuantity: number;
    }[]
  >([]);
  const [selectedInventoryLot, setSelectedInventoryLot] = useState<{
    inventoryId: string;
  } | null>(null);
  const navigate = useNavigate();

  const handleOpenPopover = (event: MouseEvent, inventoryId: string) => {
    const target = event.currentTarget as HTMLElement; // Ensure it's an HTML element

    setAnchorEl(target);
    setSelectedInventoryLot({ inventoryId });
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedInventoryLot(null);
  };
  
  const transformedData= data.map((row) => ({
    ...row,
    
    isSelect: false,
    
    warehouseInventoryLotId: row.warehouseInventoryLotId, // Ensure this exists
    itemName: row.itemName, // Ensure this exists
    lotNumber: row.lotNumber, // Ensure this exists
    
    // Audit Info
    lotCreatedBy: row.lotCreated?.by ?? 'Unknown',
    lotCreatedDate: row.lotCreated?.date ?? null,
    lotUpdatedBy: row.lotUpdated?.by ?? 'Unknown',
    lotUpdatedDate: row.lotUpdated?.date ?? null,
    indicators_isExpired: row.indicators?.isExpired ?? false,
    indicators_isNearExpiry: row.indicators?.isNearExpiry ?? false,
    indicators_isLowStock: row.indicators?.isLowStock ?? false,
    indicators_stockLevel: row.indicators?.stockLevel ?? 'none',
    indicators_expirySeverity: row.indicators?.expirySeverity ?? 'unknown',
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
    {
      id: 'itemType',
      label: 'Item Type',
      sortable: true,
      format: (value: any) => formatLabel(value),
    },
    {
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
    },
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
    },
    // 3️⃣ Stock & Warehouse Information
    {
      id: 'lotReserved',
      label: 'Lot Reserved Stock',
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
            onClick={() =>
              setSelectedLot({
                warehouseInventoryLotId: row.warehouseInventoryLotId,
                itemName: row.itemName,
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
      format: (value: string) => formatLabel(value),
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
      id: 'lastUpdate',
      label: 'Last Update',
      sortable: true,
      format: (value: any) => formatDateTime(value),
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
    {
      id: 'indicators_isExpired',
      label: 'Expired',
      sortable: true,
      renderCell: (row: WarehouseInventoryDetailExtended) => <IsExpiredChip isExpired={row.indicators_isExpired} />,
    },
    {
      id: 'indicators_isNearExpiry',
      label: 'Near Expiry',
      sortable: true,
      renderCell: (row: WarehouseInventoryDetailExtended) => <NearExpiryChip isNearExpiry={row.indicators_isNearExpiry} />,
    },
    {
      id: 'indicators_stockLevel',
      label: 'Stock Level',
      sortable: true,
      renderCell: (row: WarehouseInventoryDetailExtended) => (
        <StockLevelChip stockLevel={row.indicators_stockLevel} isLowStock={row.indicators_isLowStock} />
      ),
    },
    {
      id: 'indicators_expirySeverity',
      label: 'Expiry Severity',
      sortable: true,
      renderCell: (row: WarehouseInventoryDetailExtended) => <ExpirySeverityChip severity={row.indicators_expirySeverity} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      renderCell: (row) => (
        <Tooltip title="View Options">
          <IconButton
            size="small"
            onClick={(event) =>
              handleOpenPopover(event as unknown as MouseEvent, row.inventoryId)
            }
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
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
        <CustomButton variant="contained" color="primary"
                      startIcon={<InventoryIcon />}
                      onClick={() => {
                        setBulkInsertOpen(true);
                      }}
                      sx={{ marginTop: 2 }}
        >
          Bulk Insert Inventory
        </CustomButton>
        
        <BulkInsertInventoryModal
          open={bulkInsertOpen}
          onClose={() => setBulkInsertOpen(false)}
          warehouseId={warehouseId}
          onSubmit={handleBulkInsertSubmit}
          mode={'create'}
        />
        <InsertedInventoryRecordsResponseDialog
          insertedDataResponse={insertedDataResponse}
          open={openDialog}
          onClose={() => setOpenDialog(false)}
        />
        <CustomButton
          variant="contained"
          color="primary"
          startIcon={<InventoryIcon />}
          onClick={() => {
            const selected = data
              .filter((lot) => selectedLotIds.has(lot.warehouseInventoryLotId))
              .map((lot) => ({
                warehouseInventoryLotId: lot.warehouseInventoryLotId,
                itemName: lot.itemName,
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
        rowsPerPageOptions={[10, 30, 50, 100]}
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
          itemName={selectedLot.itemName}
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

      {/* Popover Menu */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() =>
            handleAdjustmentReportRedirect(
              navigate,
              'reports/adjustments',
              warehouseId,
              selectedInventoryLot?.inventoryId
            )
          }
        >
          View Lot Adjustment
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleInventoryActivityLogRedirect(
              navigate,
              'reports/inventory_activities',
              warehouseId,
              selectedInventoryLot?.inventoryId
            )
          }
        >
          View Inventory Activity
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleInventoryHistoryRedirect(
              navigate,
              'reports/inventory_histories',
              selectedInventoryLot?.inventoryId
            )
          }
        >
          View Inventory History
        </MenuItem>
      </Popover>
    </Box>
  );
};

export default WarehouseInventoryDetailTable;
