import { type FC, useEffect } from 'react';
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
import useLotAdjustmentTypeDropdown from '@hooks/useLotAdjustmentTypeDropdown.ts';
import InventorySuccessDialog from '@features/inventoryShared/components/InventorySuccessDialog.tsx';
import Loading from '@components/common/Loading.tsx';
import Alert from '@mui/material/Alert';

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
    loading: isSubmitting,
    error: submitError,
    adjustInventory,
    resetState,
  } = useAdjustWarehouseInventory();
  
  const {
    options: dropdownOptions,
    loading: isDropdownLoading,
    error: dropdownError,
    fetchLotAdjustmentTypeDropdown,
  } = useLotAdjustmentTypeDropdown();
  
  useEffect(() => {
    fetchLotAdjustmentTypeDropdown();
  }, [fetchLotAdjustmentTypeDropdown]);
  
  const mapped = mapInventoryRecordToAdjustData(record);
  
  const initialQuantity =
    typeof mapped.warehouseQuantity === 'number'
      ? mapped.warehouseQuantity
      : mapped.locationQuantity ?? 0;
  
  const handleAdjustSubmit = (formData: InventoryAdjustmentFormData) => {
    try {
      // Destructure the combined value from the dropdown
      const [adjustment_type_id, inventory_action_type_id] =
      formData.adjustment_type_id?.split('::') ?? [];
      
      if (!adjustment_type_id || !inventory_action_type_id) {
        console.error('Invalid adjustment type selection.');
        return;
      }
      
      const enrichedData: InventoryAdjustmentInput = {
        warehouse_id: mapped.warehouseId,
        location_id: mapped.locationId,
        batch_id: mapped.batchId,
        batch_type: mapped.batchType,
        quantity: Number(formData.newQuantity),
        inventory_action_type_id,
        adjustment_type_id,
        comments: formData.note || '',
      };
      
      const payload: AdjustInventoryRequestBody = {
        updates: [enrichedData],
      };
      
      adjustInventory(payload);
    } catch (error) {
      console.error('Adjustment failed', error);
    }
  };
  
  const handleConfirmClose = () => {
    resetState();
    onClose(); // now exit dialog
    // Refreshes data after dialog exits
    if (typeof onExited === 'function') {
      onExited();
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
      {isSubmitting ? (
        <Loading variant="dotted" size={24}  message="Submitting adjustment..." />
      ) : (
        <>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof submitError === 'string'
                  ? submitError
                  : 'An unexpected error occurred.'}
            </Alert>
          )}
          
          <AdjustInventoryForm
            initialQuantity={initialQuantity}
            contextData={mapped}
            adjustmentTypeOptions={dropdownOptions}
            dropdownLoading={isDropdownLoading}
            dropdownError={dropdownError ?? ''}
            onSubmit={handleAdjustSubmit}
            onRefresh={fetchLotAdjustmentTypeDropdown}
          />
        </>
      )}
      
      {success && (
        <InventorySuccessDialog
          onClose={handleConfirmClose}
          open={success}
          warehouse={warehouse}
          location={location}
          message={message}
        />
      )}
    </CustomDialog>
  );
};

export default AdjustInventoryDialog;
