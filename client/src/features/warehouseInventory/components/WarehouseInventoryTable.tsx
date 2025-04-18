import { type FC, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { WarehouseInventory } from '@features/warehouseInventory';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel, formatCurrency } from '@utils/textUtils';
import Box from '@mui/material/Box';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import StockLevelChip from '@features/inventory/components/StockLevelChip';
import ExpirySeverityChip from '@features/inventory/components/ExpirySeverityChip';
import CustomTable, { type Column } from '@components/common/CustomTable';

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
  const hasStatus = (row: WarehouseInventory): boolean => !!row.status;
  
  const renderStockLevelCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <StockLevelChip
          stockLevel={row.status.stockLevel}
          isLowStock={row.status.isLowStock}
        />
      ) : (
        'N/A'
      ),
    []
  );
  
  const renderExpirySeverityCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <ExpirySeverityChip severity={row.status.expirySeverity} />
      ) : (
        'N/A'
      ),
    []
  );
  
  const renderIsExpiredCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <IsExpiredChip isExpired={row.status.isExpired} />
      ) : (
        'N/A'
      ),
    []
  );
  
  const renderNearExpiryCell = useCallback(
    (row: WarehouseInventory) =>
      hasStatus(row) ? (
        <NearExpiryChip isNearExpiry={row.status.isNearExpiry} />
      ) : (
        'N/A'
      ),
    []
  );
  
  const columns: Column<WarehouseInventory>[] = [
    {
      id: 'warehouse.name',
      label: 'Warehouse',
      sortable: true,
      renderCell: (row: WarehouseInventory) =>
        row?.warehouse ? (
          <Link
            to={`/warehouse_inventories/${row.warehouse.id}`}
            style={{ textDecoration: 'none', color: 'blue' }}
          >
            {row.warehouse.name}
          </Link>
        ) : (
          'N/A'
        ),
    },
    {
      id: 'warehouse.storageCapacity',
      label: 'Storage Capacity',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.warehouse?.storageCapacity ?? '—',
    },
    {
      id: 'warehouse.location',
      label: 'Location',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) => row?.warehouse?.location ?? '—',
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
      id: 'fees.warehouseFee',
      label: 'Warehouse Fee ($)',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.fees?.warehouseFee != null ? formatCurrency(row.fees.warehouseFee) : '—',
    },
    {
      id: 'dates.lastUpdate',
      label: 'Last Update',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.dates?.lastUpdate ? formatDateTime(row.dates.lastUpdate) : '—',
    },
    {
      id: 'dates.earliestManufactureDate',
      label: 'Earliest MFG Date',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.dates?.earliestManufactureDate
          ? formatDate(row.dates.earliestManufactureDate)
          : '—',
    },
    {
      id: 'dates.nearestExpiryDate',
      label: 'Nearest Expiry',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.dates?.nearestExpiryDate
          ? formatDate(row.dates.nearestExpiryDate)
          : '—',
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
      id: 'status.isExpired',
      label: 'Expired',
      sortable: true,
      renderCell: renderIsExpiredCell,
    },
    {
      id: 'status.isNearExpiry',
      label: 'Near Expiry',
      sortable: true,
      renderCell: renderNearExpiryCell,
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
      id: 'audit.createdAt',
      label: 'Created At',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.audit?.createdAt ? formatDateTime(row.audit.createdAt) : 'N/A',
    },
    {
      id: 'audit.updatedAt',
      label: 'Updated At',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.audit?.updatedAt ? formatDateTime(row.audit.updatedAt) : 'N/A',
    },
    {
      id: 'audit.createdBy',
      label: 'Created By',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.audit?.createdBy || '—',
    },
    {
      id: 'audit.updatedBy',
      label: 'Updated By',
      sortable: true,
      format: (_: any, row?: WarehouseInventory) =>
        row?.audit?.updatedBy || '—',
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
