import { type Dispatch, type FC, type SetStateAction, useCallback, useEffect, useState } from 'react';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { AllocationEligibleOrderItem } from '@features/order';
import useRenderAllocationStatusCell from '@features/inventoryAllocation/components/useRenderAllocationStatusCell';
import IconButton from '@mui/material/IconButton';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LotAllocationLookupMiniTable from '@features/inventoryAllocation/components/LotAllocationLookupMiniTable';
import CustomTypography from '@components/common/CustomTypography';
import type { WarehouseDropdownItem } from '@features/warehouseInventory';
import CustomButton from '@components/common/CustomButton';
import AllocateInventoryDialog from '@features/inventoryAllocation/components/AllocateInventoryDialog.tsx';
import usePostInventoryAllocation from '@hooks/usePostInventoryAllocation.ts';
import type { AvailableInventoryLot, InventoryAllocationPayload } from '@features/inventoryAllocation';

interface Props {
  items: AllocationEligibleOrderItem[];
  eligibleOrderDetailsLoading?: boolean;
  orderId: string;
  warehouses: WarehouseDropdownItem[];
  warehouseLoading: boolean;
  refreshWarehouses: () => void;
}

export type LotSelectionsState = {
  [inventoryId: string]: {
    [warehouseId: string]: string[]; // selected lotIds
  };
};

interface ToggleLotArgs {
  lot: AvailableInventoryLot;
  lotSelections: LotSelectionsState;
  setLotSelections: Dispatch<SetStateAction<LotSelectionsState>>;
  visibleLotMap: Map<string, AvailableInventoryLot>;
  setVisibleLotMap: Dispatch<SetStateAction<Map<string, AvailableInventoryLot>>>;
}

const InventoryAllocationDetailsTable: FC<Props> = ({ orderId, items, eligibleOrderDetailsLoading, warehouses, warehouseLoading, refreshWarehouses }) => {
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);
  const [lotSelections, setLotSelections] = useState<LotSelectionsState>({});
  const [visibleLotMap, setVisibleLotMap] = useState<Map<string, AvailableInventoryLot>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { submit } = usePostInventoryAllocation();
  
  const renderAllocationStatusCell = useRenderAllocationStatusCell();

  const handleExpandToggle = useCallback(
    (index: number) => {
      const isCurrentlyExpanded = expandedRowIndex === index;
      const nextIndex = isCurrentlyExpanded ? null : index;
      
      const selectedItem = items?.[index];
      const nextInventoryId = !isCurrentlyExpanded && selectedItem
        ? selectedItem.inventory_id ?? null
        : null;
      
      setExpandedRowIndex(nextIndex);
      setExpandedInventoryId(nextInventoryId);
    },
    [expandedRowIndex, items]
  );
  
  useEffect(() => {
    console.log('[Lot Selections]', lotSelections);
  }, [lotSelections]);
  
  const renderToggleCell = useCallback(
    (_: AllocationEligibleOrderItem, rowIndex?: number) => {
      const index = rowIndex ?? 0;
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => handleExpandToggle(index)}>
            {expandedRowIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <CustomTypography>{_.item_name}</CustomTypography>
        </Stack>
      );
    },
    [expandedRowIndex, handleExpandToggle]
  );
  
  const toggleLotSelectionAndCacheMeta = ({
                                            lot,
                                            setLotSelections,
                                            visibleLotMap,
                                            setVisibleLotMap,
                                          }: ToggleLotArgs): void => {
    const { inventoryId, warehouseId, lotId } = lot;
    
    if (!inventoryId || !warehouseId || !lotId) return;
    
    // Update lotSelections
    setLotSelections((prev) => {
      const warehouseSelections = prev[inventoryId]?.[warehouseId] || [];
      
      const updatedLotIds = warehouseSelections.includes(lotId)
        ? warehouseSelections.filter((id) => id !== lotId)
        : [...warehouseSelections, lotId];
      
      return {
        ...prev,
        [inventoryId]: {
          ...prev[inventoryId],
          [warehouseId]: updatedLotIds,
        },
      };
    });
    
    // Cache metadata if not already in visibleLotMap
    if (!visibleLotMap.has(lotId)) {
      setVisibleLotMap((prev) => {
        const next = new Map(prev);
        next.set(lotId, lot);
        return next;
      });
    }
  };
  
  const columns: Column<AllocationEligibleOrderItem>[] = [
    {
      id: 'item_name',
      label: 'Item Name',
      minWidth: 50,
      renderCell: renderToggleCell,
    },
    {
      id: 'barcode',
      label: 'Barcode',
      minWidth: 50,
    },
    {
      id: 'quantity_ordered',
      label: 'Ordered',
      minWidth: 50,
    },
    {
      id: 'available_quantity',
      label: 'Available',
      minWidth: 50,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 50,
      renderCell: renderAllocationStatusCell,
    },
  ];
  console.log(items)
  console.log(visibleLotMap)
  const renderExpandedContent = useCallback(
    () => (
      <Box sx={{ p: 2 }}>
        <LotAllocationLookupMiniTable
          inventoryId={expandedInventoryId}
          warehouses={warehouses}
          warehouseLoading={warehouseLoading}
          refreshWarehouses={refreshWarehouses}
          selectedLotIds={(warehouseId: string, inventoryId: string) =>
            inventoryId && warehouseId
              ? lotSelections[inventoryId]?.[warehouseId] || []
              : []
          }
          onToggleLot={(lot) =>
            toggleLotSelectionAndCacheMeta({
              lot,
              lotSelections,
              setLotSelections,
              visibleLotMap,
              setVisibleLotMap,
            })
          }
          onVisibleLotsChange={(incomingLots) => {
            setVisibleLotMap((prevMap) => {
              const newMap = new Map(prevMap);
              for (const lot of incomingLots) {
                newMap.set(lot.lotId, lot);
              }
              return newMap;
            });
          }}
        />
      </Box>
    ),
    [expandedInventoryId, warehouses, warehouseLoading, refreshWarehouses, lotSelections]
  );
  
  const allItemsHaveLotsSelected = () => {
    return items.every((item) => {
      const inventoryId = item.inventory_id;
      const warehouseSelections = lotSelections[inventoryId];
      return warehouseSelections && Object.values(warehouseSelections).some((lotIds) => lotIds.length > 0);
    });
  };
  
  const handleOpenDialog = () => {
    if (allItemsHaveLotsSelected()) {
      setDialogOpen(true);
    } else {
      alert('Please select at least one lot for each order item.');
    }
  };
  
  const getSelectedLotsFromSelections = (
    lotSelections: LotSelectionsState,
    visibleLotMap: Map<string, AvailableInventoryLot>
  ): AvailableInventoryLot[] => {
    const selectedLots: AvailableInventoryLot[] = [];
    
    for (const [_inventoryId, warehouseMap] of Object.entries(lotSelections)) {
      for (const [_warehouseId, lotIds] of Object.entries(warehouseMap)) {
        for (const lotId of lotIds) {
          const lot = visibleLotMap.get(lotId);
          if (lot) {
            selectedLots.push(lot);
          }
        }
      }
    }
    
    return selectedLots;
  };
  
  const selectedVisibleLots = getSelectedLotsFromSelections(
    lotSelections,
    visibleLotMap
  );
  
  console.log('lotSelections:', lotSelections);
  console.log('visibleLotMap:', Array.from(visibleLotMap.values()));
  console.log('selectedVisibleLots:', selectedVisibleLots);
  
  const handleAllocateInventory = async (payload: InventoryAllocationPayload) => {
    try {
      await submit(payload);
      console.log('Inventory allocation successful!');
      // // You can also trigger a data refresh or close the dialog
      // fetchAllocationData();
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to allocate inventory.', err);
    }
  };
  
  return (
    <Box>
      <CustomTable
        loading={eligibleOrderDetailsLoading}
        columns={columns}
        data={items}
        page={0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        initialRowsPerPage={items.length}
        rowsPerPageOptions={[items.length]}
        expandable={true}
        expandedRowIndex={expandedRowIndex}
        expandedContent={renderExpandedContent}
        emptyMessage="No allocation items found for this order."
      />
      <CustomButton onClick={handleOpenDialog} disabled={!allItemsHaveLotsSelected()}>
        Proceed to Confirm Allocation
      </CustomButton>
      <AllocateInventoryDialog
        onClose={() => setDialogOpen(false)}
        open={dialogOpen}
        orderId={orderId}
        lotSelections={lotSelections}
        visibleLots={selectedVisibleLots}
        onSubmit={handleAllocateInventory}
      />
    </Box>
  );
};

export default InventoryAllocationDetailsTable;
