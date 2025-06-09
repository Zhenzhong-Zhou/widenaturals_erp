import { type FC, useEffect } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import AdjustBulkInventoryForm from '@features/warehouseInventory/components/AdjustBulkInventoryForm';
import {
  mapInventoryRecordsToAdjustData,
} from '@features/inventoryShared/utils/adjustInventoryRecordMapper';
import useAdjustWarehouseInventory from '@hooks/useAdjustWarehouseInventory';
import type {
  InventoryAdjustmentFormData,
  InventoryAdjustmentInput,
  InventoryRecord,
} from '@features/inventoryShared/types/InventorySharedType.ts';
import useLotAdjustmentTypeDropdown from '@hooks/useLotAdjustmentTypeDropdown.ts';
import InventorySuccessDialog from '@features/inventoryShared/components/InventorySuccessDialog.tsx';
import Loading from '@components/common/Loading.tsx';
import Alert from '@mui/material/Alert';

interface AdjustBulkInventoryDialogProps {
  open: boolean;
  selectedRowIds: string[];
  selectedRecords: InventoryRecord[];
  onClose: () => void;
  onExited?: () => void;
}

const AdjustBulkInventoryDialog: FC<AdjustBulkInventoryDialogProps> = ({
                                                                 open,
                                                                 selectedRecords,
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
  
  if (!selectedRecords) return null;
  const mappedArray = mapInventoryRecordsToAdjustData(selectedRecords);
  
  const initialQuantities = mappedArray.map((mapped) =>
    typeof mapped.warehouseQuantity === 'number'
      ? mapped.warehouseQuantity
      : mapped.locationQuantity ?? 0
  );
  
  const handleAdjustSubmit = (formDataArray: InventoryAdjustmentFormData[]) => {
    try {
      const updates: InventoryAdjustmentInput[] = formDataArray.map((formData, index) => {
        const record = mappedArray[index];
        if (!record) {
          throw new Error(`No corresponding inventory record found for form entry at index ${index}`);
        }
        const [adjustment_type_id, inventory_action_type_id] =
        formData.adjustment_type_id?.split('::') ?? [];
        
        if (!adjustment_type_id || !inventory_action_type_id) {
          throw new Error('Invalid adjustment type selection.');
        }
        
        return {
          warehouse_id: record.warehouseId,
          location_id: record.locationId,
          batch_id: record.batchId,
          batch_type: record.batchType,
          quantity: Number(formData.newQuantity),
          inventory_action_type_id,
          adjustment_type_id,
          comments: formData.note || '',
        };
      });
      
      adjustInventory({ updates });
    } catch (error) {
      console.error('Bulk adjustment failed', error);
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
      title={'Bulk Inventory Adjustment'}
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
          
          <AdjustBulkInventoryForm
            initialQuantities={initialQuantities}
            contextData={mappedArray}
            adjustmentTypeOptions={dropdownOptions}
            dropdownLoading={isDropdownLoading}
            dropdownError={dropdownError ?? ''}
            onSubmit={handleAdjustSubmit}
            onRefresh={fetchLotAdjustmentTypeDropdown}
            loading={isSubmitting}
          />
        </>
      )}
      
      {/* Success Confirmation Dialog */}
      {success && (
        <InventorySuccessDialog
          open={success}
          onClose={handleConfirmClose}
          warehouse={warehouse}
          location={location}
          message={message}
        />
      )}
    </CustomDialog>
  );
};

export default AdjustBulkInventoryDialog;
