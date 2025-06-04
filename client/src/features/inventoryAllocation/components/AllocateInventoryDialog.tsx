import { type FC, useState } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import { useForm } from 'react-hook-form';
import type { AvailableInventoryLot, InventoryAllocationPayload } from '@features/inventoryAllocation';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import BaseInput from '@components/common/BaseInput.tsx';
import CustomButton from '@components/common/CustomButton';
import type { LotSelectionsState } from './InventoryAllocationDetailsTable';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { formatLabel } from '@utils/textUtils.ts';

interface AllocateInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: InventoryAllocationPayload) => void;
  orderId: string;
  lotSelections: LotSelectionsState;
  visibleLots: AvailableInventoryLot[];
}

const AllocateInventoryDialog: FC<AllocateInventoryDialogProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     onSubmit,
                                                                     orderId,
                                                                     lotSelections,
                                                                     visibleLots
                                                                   }) => {
  const { handleSubmit } = useForm();
  const [lotQuantities, setLotQuantities] = useState<Record<string, number>>({});
  const [allowPartial, setAllowPartial] = useState(true);
  
  const buildInventoryAllocationPayload = (): InventoryAllocationPayload => {
    const items: InventoryAllocationPayload['items'] = [];
    
    for (const [inventoryId, warehouseMap] of Object.entries(lotSelections)) {
      for (const [warehouseId, lotIds] of Object.entries(warehouseMap)) {
        const filteredLotIds = lotIds.filter((lotId) => (lotQuantities[lotId] ?? 0) > 0);
        
        if (filteredLotIds.length > 0) {
          const totalQty = filteredLotIds.reduce((sum, lotId) => sum + (lotQuantities[lotId] || 0), 0);
          
          items.push({
            inventoryId,
            warehouseId,
            quantity: totalQty,
            lotIds: filteredLotIds,
            allowPartial,
          });
        }
      }
    }
    
    return {
      orderId,
      items,
    };
  };
  
  const handleFormSubmit = () => {
    const payload = buildInventoryAllocationPayload();
    if (payload.items.length === 0) {
      alert('Please enter quantity for at least one lot.');
      return;
    }
    onSubmit(payload);
    onClose();
  };
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Confirm Allocation"
      showCancelButton
    >
      {/* --- Lot Summary Table --- */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Selected Lots
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Lot Number</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Available Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Allocated Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleLots.map((lot) => (
              <TableRow key={lot.lotId}>
                <TableCell>{lot.itemName}</TableCell>
                <TableCell>{lot.warehouseName}</TableCell>
                <TableCell>{lot.lotNumber}</TableCell>
                <TableCell>{formatDate(lot.expiryDate)}</TableCell>
                <TableCell>{lot.availableQuantity}</TableCell>
                <TableCell>{formatLabel(lot.status)}</TableCell>
                <TableCell>
                  <BaseInput
                    type="number"
                    value={lotQuantities[lot.lotId] ?? ''}
                    onChange={(e) =>
                      setLotQuantities((prev) => ({
                        ...prev,
                        [lot.lotId]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    inputProps={{ min: 1 }}
                    size="small"
                    sx={{ width: 80 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      
      {/* --- Allow Partial Checkbox + Submit Button --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={allowPartial}
            onChange={(e) => setAllowPartial(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Allow Partial Allocation
        </label>
        
        <CustomButton onClick={handleSubmit(handleFormSubmit)}>
          Allocate
        </CustomButton>
      </Box>
    </CustomDialog>
  );
};

export default AllocateInventoryDialog;
