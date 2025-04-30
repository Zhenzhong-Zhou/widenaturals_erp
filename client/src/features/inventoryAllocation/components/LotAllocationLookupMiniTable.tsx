import { type FC, useEffect, useState } from 'react';
import { formatDate } from '@utils/dateTimeUtils';
import CustomMiniTable, {
  type MiniColumn,
} from '@components/common/CustomMiniTable';
import type { AvailableInventoryLot } from '@features/inventoryAllocation';
import { formatLabel } from '@utils/textUtils';
import { NearExpiryChip } from '@features/inventory';
import type { WarehouseDropdownItem } from '@features/warehouseInventory';
import WarehouseDropdown from '@features/warehouse/components/WarehouseDropdown';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import useAvailableInventoryLots from '@hooks/useAvailableInventoryLots';
import Checkbox from '@mui/material/Checkbox';

interface Props {
  inventoryId: string | null;
  warehouses: WarehouseDropdownItem[];
  warehouseLoading: boolean;
  refreshWarehouses: () => void;
  selectedLotIds: (warehouseId: string, lookupInventoryId: string) => string[];
  // onToggleLot: (warehouseId: string, lotId: string, lookupInventoryId: string) => void;
  onToggleLot: (lot: AvailableInventoryLot) => void
  onVisibleLotsChange: (lots: AvailableInventoryLot[]) => void;
}

const LotAllocationLookupMiniTable: FC<Props> = ({ inventoryId, warehouses, warehouseLoading, refreshWarehouses, selectedLotIds, onToggleLot, onVisibleLotsChange }) => {
  if (!inventoryId) return null;
  
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  
  const {
    lots,
    loading: lotsLoading,
    error,
    fetchInventoryLots,
  } = useAvailableInventoryLots({ inventoryId: inventoryId ?? '', warehouseId: selectedWarehouseId ?? '', strategy: 'FEFO' });
  console.log(lots)
  // Fetch on mount or when warehouse selection changes
  useEffect(() => {
    if (!inventoryId) return;
    
    // Optional: prevent refetch on unchanged warehouseId
    fetchInventoryLots({
      inventoryId,
      warehouseId: selectedWarehouseId ?? '',
      strategy: 'FEFO',
    });
  }, [inventoryId, selectedWarehouseId]);
  
  useEffect(() => {
    if (!lotsLoading && lots.length > 0 && inventoryId) {
      onVisibleLotsChange?.(
        lots.map((lot: AvailableInventoryLot) => ({
          ...lot,
          inventoryId, // inject context if needed
        }))
      );
    }
  }, [lotsLoading, lots, inventoryId]);
  
  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    if (inventoryId && warehouseId) {
      fetchInventoryLots({ inventoryId, warehouseId: warehouseId ?? '', strategy: 'FIFO' });
    }
  };
  console.log(lots)
  const columns: MiniColumn<AvailableInventoryLot>[] = [
    {
      id: 'select',
      label: '',
      renderCell: (row) => {
        console.log('[MiniTable Row]', row);  // Logs the entire row object
        return (
          <Checkbox
            checked={selectedLotIds(row.warehouseId, row.inventoryId).includes(row.lotId)}
            // onChange={() => onToggleLot(row.warehouseId, row.lotId, row.inventoryId)}
            onChange={() => onToggleLot(row)}
          />
        );
      },
    },
    {
      id: 'warehouseName',
      label: 'Warehouse',
    },
    { id: 'lotNumber', label: 'Lot Number' },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      format: (value) => formatDate(value),
    },
    {
      id: 'lotQuantity',
      label: 'Lot Quantity'
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved Quantity'
    },
    {
      id: 'availableQuantity',
      label: 'Available Quantity'
    },
    {
      id: 'manufactureDate',
      label: 'Manufacture Date',
      format: (value) => formatDate(value),
    },
    {
      id: 'inboundDate',
      label: 'Inbound Date',
      format: (value) => formatDate(value),
    },
    {
      id: 'status',
      label: 'Status',
      format: (value) => formatLabel(value),
    },
    {
      id: 'isNearExpiry',
      label: 'Near Expiry',
      renderCell: (row) => <NearExpiryChip isNearExpiry={row.isNearExpiry} />
    },
  ];
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <WarehouseDropdown
          label="Warehouse"
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          value={selectedWarehouseId ?? ''}
          onChange={handleWarehouseChange}
          onRefresh={refreshWarehouses}
          loading={warehouseLoading}
        />
      </Box>
      
      {lotsLoading ? (
        <Skeleton variant="rectangular" height={120} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <CustomMiniTable<AvailableInventoryLot>
          columns={columns}
          data={lots}
          emptyMessage="No lots available"
        />
      )}
    </Box>
  );
};

export default LotAllocationLookupMiniTable;
