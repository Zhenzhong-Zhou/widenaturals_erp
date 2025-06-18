import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import AdjustBulkInventoryForm from '@features/warehouseInventory/components/AdjustBulkInventoryForm';
import {
  useInventoryAdjustmentDialogLogic
} from '@features/inventoryShared/utils/useInventoryAdjustmentDialogLogic.ts';
import InventorySuccessDialog from '@features/inventoryShared/components/InventorySuccessDialog';
import Loading from '@components/common/Loading';
import Alert from '@mui/material/Alert';
import type { InventoryRecord } from '@features/inventoryShared/types/InventorySharedType';

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
    mode: 'bulk',
    records: selectedRecords,
  });
  
  const handleConfirmClose = () => {
    resetState();
    onClose();
    if (onExited) onExited();
  };
  
  return (
    <CustomDialog
      open={open}
      title="Bulk Inventory Adjustment"
      onClose={onClose}
      disableCloseOnBackdrop={false}
      disableCloseOnEscape={false}
    >
      {isSubmitting ? (
        <Loading variant="dotted" size={24} message="Submitting adjustment..." />
      ) : success ? (
        // Render success view inside the dialog
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
          <AdjustBulkInventoryForm
            initialQuantities={initialQuantities}
            contextData={mappedRecords}
            adjustmentTypeOptions={lookupOptions}
            dropdownLoading={isLookupLoading}
            dropdownError={lookupError ?? ''}
            onSubmit={handleSubmit}
            onRefresh={fetchLotAdjustmentTypeLookup}
            loading={isSubmitting}
          />
        </>
      )}
    </CustomDialog>
  );
};

export default AdjustBulkInventoryDialog;
