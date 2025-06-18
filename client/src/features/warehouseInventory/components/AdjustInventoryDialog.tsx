import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import AdjustInventoryForm from '@features/warehouseInventory/components/AdjustInventoryForm';
import Loading from '@components/common/Loading';
import Alert from '@mui/material/Alert';
import InventorySuccessDialog from '@features/inventoryShared/components/InventorySuccessDialog';
import type {
  InventoryAdjustmentFormData,
  InventoryRecord,
} from '@features/inventoryShared/types/InventorySharedType';
import {
  useInventoryAdjustmentDialogLogic
} from '@features/inventoryShared/utils/useInventoryAdjustmentDialogLogic.ts';

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
    isSubmitting,
    submitError,
    lookupOptions,
    isLookupLoading,
    lookupError,
    mappedRecords,
    initialQuantities,
    fetchLotAdjustmentTypeLookup,
    handleSubmit,
    resetState,
  } = useInventoryAdjustmentDialogLogic({
    mode: 'single',
    records: [record],
  });
  
  const [mapped] = mappedRecords;
  const [initialQuantity] = initialQuantities;
  
  if (!mapped || initialQuantity === undefined) return null;
  
  const handleConfirmClose = () => {
    resetState();
    onClose();
    if (typeof onExited === 'function') {
      onExited();
    }
  };
  
  return (
    <CustomDialog
      open={open}
      title={`Adjust Inventory: ${mappedRecords[0]?.displayName ?? ''}`}
      onClose={onClose}
      disableCloseOnBackdrop={false}
      disableCloseOnEscape={false}
    >
      {isSubmitting ? (
        <Loading variant="dotted" size={24} message="Submitting adjustment..." />
      ) : success ? (
        <InventorySuccessDialog
          open={true}
          onClose={handleConfirmClose}
          warehouse={warehouse}
          location={location}
          message={message}
        />
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
            adjustmentTypeOptions={lookupOptions}
            dropdownLoading={isLookupLoading}
            dropdownError={lookupError ?? ''}
            onSubmit={handleSubmit as (data: InventoryAdjustmentFormData) => void}
            onRefresh={fetchLotAdjustmentTypeLookup}
            loading={isSubmitting}
          />
        </>
      )}
    </CustomDialog>
  );
};

export default AdjustInventoryDialog;
