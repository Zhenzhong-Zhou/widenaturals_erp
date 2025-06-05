import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import AdjustInventoryForm from '@features/warehouseInventory/components/AdjustInventoryForm';
import {
  type InventoryRecord,
  mapInventoryRecordToAdjustData,
} from '@features/inventoryShared/utils/mapInventoryRecordToAdjustData';
import useAdjustWarehouseInventory from '@hooks/useAdjustWarehouseInventory.ts';
import type {
  AdjustInventoryRequestBody, InventoryAdjustmentFormData,
  InventoryAdjustmentInput,
} from '@features/inventoryShared/types/InventorySharedType.ts';

interface AdjustInventoryDialogProps {
  open: boolean;
  record: InventoryRecord;
  onClose: () => void;
  onExited?: () => void;
}

const AdjustInventoryDialog: FC<AdjustInventoryDialogProps> = ({
                                                                 open,
                                                                 record,
                                                                 onClose,
                                                                 onExited,
                                                               }) => {
  const {
    warehouse,
    location,
    message,
    success,
    loading,
    error,
    adjustInventory,
    resetState,
  } = useAdjustWarehouseInventory();
  
  const mapped = mapInventoryRecordToAdjustData(record);
  console.log(warehouse,
    location,
    message,
    success,
    loading,
    error)
  const initialQuantity =
    typeof mapped.warehouseQuantity === 'number'
      ? mapped.warehouseQuantity
      : mapped.locationQuantity ?? 0;
  
  const handleAdjustSubmit = (formData: InventoryAdjustmentFormData) => {
    try {
      const enrichedData: InventoryAdjustmentInput = {
        warehouse_id: mapped.warehouseId,
        location_id: mapped.locationId,
        batch_id: mapped.batchId,
        batch_type: mapped.batchType,
        quantity: Number(formData.newQuantity),
        inventory_action_type_id: formData.inventory_action_type_id,
        adjustment_type_id: formData.adjustment_type_id,
        comments: formData.note || '',
      };
      
      const payload: AdjustInventoryRequestBody = {
        updates: [enrichedData],
      };
      
      console.log(payload);
      adjustInventory(payload);
      // onClose();
    } catch (error) {
      console.error('Adjustment failed', error);
    }
  };
  
  return (
    <CustomDialog
      open={open}
      title={`Adjust Inventory: ${mapped.displayName}`}
      onClose={onClose}
      disableCloseOnBackdrop={false}
      disableCloseOnEscape={false}
    >
      <AdjustInventoryForm
        initialQuantity={initialQuantity}
        contextData={mapped}
        inventoryActionOptions={[]}
        adjustmentTypeOptions={[]}
        onSubmit={handleAdjustSubmit}
      />
    </CustomDialog>
  );
};

export default AdjustInventoryDialog;
