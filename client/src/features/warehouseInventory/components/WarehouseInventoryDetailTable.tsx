import { type FC, lazy, type ReactNode, Suspense, useCallback, useState } from 'react';
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Skeleton from '@mui/material/Skeleton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import BulkInsertInventoryModal from '@features/warehouseInventory/components/BulkInsertInventoryModal';
import InsertedInventoryRecordsResponseDialog from '@features/warehouseInventory/components/InsertedInventoryRecordsResponseDialog';
import CustomTable from '@components/common/CustomTable';
import EditQuantityModal from '@features/warehouseInventory/components/EditQuantityModal';
import BulkAdjustQuantityModal from '@features/warehouseInventory/components/BulkAdjustQuantityModal';
import type {
  WarehouseInventoryDetailExtended,
  WarehouseInventoryInsertResponse,
} from '@features/warehouseInventory';
import { formatLabel } from '@utils/textUtils';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import {
  handleAdjustmentReportRedirect,
  handleInventoryActivityLogRedirect,
  handleInventoryHistoryRedirect,
} from '@utils/navigationUtils';
import WarehouseInventoryDetailsAuditDrawer
  from '@features/warehouseInventory/components/WarehouseInventoryDetailsAuditDrawer';

const WarehouseLotDetailsInlineSection = lazy(
  () => import('@features/warehouseInventory/components/WarehouseLotDetailsInlineSection')
);

// Define Column Type explicitly
interface Column<T> {
  id: keyof T | 'actions' | 'select';
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  format?: (value: any, row?: T) => string | number | null | undefined;
  renderCell?: (row: T, rowIndex?: number) => ReactNode;
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

type TransformedWarehouseInventoryRow = WarehouseInventoryDetailExtended & {
  isSelect: boolean;
  lotCreatedBy: string;
  lotCreatedDate: string | null;
  lotUpdatedBy: string;
  lotUpdatedDate: string | null;
  indicators_isExpired: boolean;
  indicators_isNearExpiry: boolean;
  indicators_isLowStock: boolean;
  indicators_stockLevel: string;
  indicators_expirySeverity: string;
};

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
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [selectedAuditRow, setSelectedAuditRow] = useState<WarehouseInventoryDetailExtended | null>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleOpenPopover = useCallback(
    (event: MouseEvent, inventoryId: string) => {
      const target = event.currentTarget as HTMLElement;
      setAnchorEl(target);
      setSelectedInventoryLot({ inventoryId });
    },
    [setAnchorEl, setSelectedInventoryLot] // include only stable state setters
  );
  
  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedInventoryLot(null);
  };
  
  const transformedData: TransformedWarehouseInventoryRow[] = data.map((row) => ({
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
  
  const handleAuditInfoClick = (row: WarehouseInventoryDetailExtended) => {
    setSelectedAuditRow(row);
    setAuditDrawerOpen(true);
  };
  
  const renderExpandedContent = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
      <Suspense
        fallback={
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={140} />
          </Box>
        }
      >
        <WarehouseLotDetailsInlineSection row={row} sx={{ pl: 2 }} />
      </Suspense>
    ),
    [] // dependencies (you can add `pl` or any dynamic value if needed)
  );
  
  const renderIsExpiredCell = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
      <IsExpiredChip isExpired={row.indicators_isExpired} />
    ),
    []
  );
  
  const renderStockLevelCell = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
      <StockLevelChip
        stockLevel={row.indicators_stockLevel}
        isLowStock={row.indicators_isLowStock}
      />
    ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
      <ExpirySeverityChip severity={row.indicators_expirySeverity} />
    ),
    []
  );
  
  const handleEditClick = useCallback((row: WarehouseInventoryDetailExtended) => {
    setSelectedLot({
      warehouseInventoryLotId: row.warehouseInventoryLotId,
      itemName: row.itemName,
      lotNumber: row.lotNumber,
      quantity: row.lotQuantity,
    });
  }, []);
  
  const renderItemNameCell = useCallback(
    (row: TransformedWarehouseInventoryRow, rowIndex?: number): ReactNode => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {row.itemName}
        <Tooltip
          title={
            rowIndex !== undefined && expandedRowIndex === rowIndex
              ? 'Hide Details'
              : 'Show Details'
          }
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (rowIndex !== undefined) {
                setExpandedRowIndex((prev) =>
                  prev === rowIndex ? null : rowIndex
                );
              }
            }}
            size="small"
          >
            {rowIndex !== undefined && expandedRowIndex === rowIndex ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [expandedRowIndex]
  ) as Column<TransformedWarehouseInventoryRow>['renderCell'];
  
  const renderLotQuantityCell = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {row.lotQuantity}
        <IconButton size="small" onClick={() => handleEditClick(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
    [handleEditClick]
  );
  
  const renderActionsCell = useCallback(
    (row: WarehouseInventoryDetailExtended) => (
    <Box>
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
      <Tooltip title="Audit Info">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleAuditInfoClick(row);
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
    ),
    [handleOpenPopover]
  );
  
  // Define table columns
  const columns: Column<TransformedWarehouseInventoryRow>[] = [
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
      id: 'itemName',
      label: 'Item Name',
      sortable: true,
      renderCell: renderItemNameCell,
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
      renderCell: renderLotQuantityCell,
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
      id: 'indicators_isExpired',
      label: 'Expired',
      sortable: true,
      renderCell: renderIsExpiredCell,
    },
    {
      id: 'indicators_stockLevel',
      label: 'Stock Level',
      sortable: true,
      renderCell: renderStockLevelCell,
    },
    {
      id: 'indicators_expirySeverity',
      label: 'Expiry Severity',
      sortable: true,
      renderCell: renderExpirySeverityCell,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      renderCell: renderActionsCell,
    },
  ];
  
  return (
    <Box>
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            checked={selectedLotIds.size > 0 && selectedLotIds.size === data.length}
            onChange={toggleSelectAll}
            color="primary"
          />
          <CustomTypography variant="body1" sx={{ fontWeight: 500 }}>
            Select All
          </CustomTypography>
        </Box>
        <CustomTypography variant="h5">
          Warehouse Inventory Lots
        </CustomTypography>
        {/* Pass handleBulkInsertSubmit function to modal */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <CustomButton
            variant="contained"
            color="primary"
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
        </Box>
      </Paper>
      <CustomTable
        columns={columns}
        data={transformedData}
        page={page}
        initialRowsPerPage={rowsPerPage}
        rowsPerPageOptions={[30, 50, 75, 100]}
        totalRecords={totalRecords}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        expandable={true}
        expandedContent={renderExpandedContent}
        expandedRowIndex={expandedRowIndex}
      />
      
      <WarehouseInventoryDetailsAuditDrawer
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        data={selectedAuditRow}
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
