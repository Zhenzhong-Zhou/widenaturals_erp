import { type FC, lazy, Suspense, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WarehouseInventory } from '@features/warehouseInventory';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import Box from '@mui/material/Box';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import CustomTable, { type Column } from '@components/common/CustomTable';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useThemeContext } from '@context/ThemeContext.tsx';
import WarehouseInventoryAuditDrawer
  from '@features/warehouseInventory/components/WarehouseInventoryAuditDrawer.tsx';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const WarehouseInventoryInlineDetailsSection = lazy(
  () => import('@features/warehouseInventory/components/WarehouseInventoryInlineDetailsSection')
);

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
  const { theme } = useThemeContext();
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [selectedAuditRow, setSelectedAuditRow] = useState<WarehouseInventory | null>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const hasStatus = (row: WarehouseInventory): boolean => !!row.status;
  
  const handleAuditInfoClick = (row: WarehouseInventory) => {
    setSelectedAuditRow(row);
    setAuditDrawerOpen(true);
  };
  
  const renderWarehouseNameCell = useCallback(
    (row: WarehouseInventory, rowIndex?: number) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {row.warehouse ? (
          <Link
            to={`/warehouse_inventories/${row.warehouse.id}`}
            style={{ textDecoration: 'none', color: theme.palette.primary.main, fontWeight: 500 }}
          >
            {row.warehouse.name}
          </Link>
        ) : (
          '—'
        )}
        
        <Tooltip
          title={rowIndex !== undefined && expandedRowIndex === rowIndex ? 'Hide Details' : 'Show Details'}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (rowIndex !== undefined) {
                setExpandedRowIndex((prev) => (prev === rowIndex ? null : rowIndex));
              }
            }}
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
  ) as Column<WarehouseInventory>['renderCell'];
  
  const renderExpandedContent = (row: WarehouseInventory) => (
    <Suspense fallback={<Box sx={{ p: 2 }}>Loading...</Box>}>
      <WarehouseInventoryInlineDetailsSection row={row} sx={{ pl: 2 }} />
    </Suspense>
  );
  
  const renderStockLevelCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <StockLevelChip
          stockLevel={row.status.stockLevel}
          isLowStock={row.status.isLowStock}
        />
      ) : (
        '—'
      ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <ExpirySeverityChip severity={row.status.expirySeverity} />
      ) : (
        '—'
      ),
    []
  );
  
  const renderActionsCell = useCallback(
    (row: WarehouseInventory) => (
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
    ),
    [handleAuditInfoClick]
  );
  
  const columns: Column<WarehouseInventory>[] = [
    {
      id: 'warehouse.name',
      label: 'Warehouse',
      sortable: true,
      renderCell: renderWarehouseNameCell,
    },
    {
      id: 'inventory.itemType',
      label: 'Item Type',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.inventory?.itemType ? formatLabel(row.inventory.itemType) : '—',
    },
    {
      id: 'inventory.itemName',
      label: 'Item Name',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.inventory?.itemName ?? '—',
    },
    {
      id: 'quantity.available',
      label: 'Available Qty',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.quantity?.available ?? 0,
    },
    {
      id: 'quantity.lotReserved',
      label: 'Lot Reserved Qty',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.quantity?.lotReserved ?? 0,
    },
    {
      id: 'quantity.reserved',
      label: 'Reserved Qty',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.quantity?.reserved ?? 0,
    },
    {
      id: 'quantity.inStock',
      label: 'In-Stock Qty',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.quantity?.inStock ?? 0,
    },
    {
      id: 'quantity.totalLot',
      label: 'Total Lot Qty',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.quantity?.totalLot ?? 0,
    },
    {
      id: 'dates.lastUpdate',
      label: 'Last Update',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.dates?.lastUpdate ? formatDateTime(row.dates.lastUpdate) : '—',
    },
    {
      id: 'status.display',
      label: 'Display Status',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.status?.display ? formatLabel(row.status.display) : '—',
    },
    {
      id: 'status.stockLevel',
      label: 'Stock Level',
      sortable: true,
      renderCell: renderStockLevelCell,
    },
    {
      id: 'status.expirySeverity',
      label: 'Expiry Severity',
      sortable: true,
      renderCell: renderExpirySeverityCell,
    },
    {
      id: 'status.displayNote',
      label: 'Display Note',
      sortable: false,
      format: (_: any, row?: WarehouseInventory) =>
        row?.status?.displayNote || '—',
    },
    {
      id: 'dates.displayStatusDate',
      label: 'Display Status Date',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.dates?.displayStatusDate
          ? formatDateTime(row.dates.displayStatusDate)
          : 'N/A',
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
        expandable={true}
        expandedRowIndex={expandedRowIndex}
        expandedContent={renderExpandedContent}
      />
      
      <WarehouseInventoryAuditDrawer
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        data={selectedAuditRow}
      />
    </Box>
  );
};

export default WarehouseInventoryTable;
