import { type FC, useCallback, useEffect, useRef } from 'react';
import { CustomModal, ErrorMessage } from '@components/index';
import { useWarehouseInventoryAdjustQuantity } from '@hooks/index';
import type {
  FlattenedWarehouseInventory,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';
import SingleRecordAdjustForm from './SingleRecordAdjustForm';
import BatchAdjustForm from './BatchAdjustForm';
import {
  buildBatchAdjustPayload,
  buildSingleAdjustPayload,
} from './adjustQuantitiesPayload';

interface AdjustQuantitiesModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  /**
   * Single mode (detail page): pass record.
   * Batch mode (list page): pass selectedItems.
   */
  record?: WarehouseInventoryDetailRecord;
  selectedItems?: FlattenedWarehouseInventory[];
  canAdjustReserved?: boolean;
  onSuccess?: (message?: string) => void;
}

const AdjustQuantitiesModal: FC<AdjustQuantitiesModalProps> = ({
                                                                 open,
                                                                 onClose,
                                                                 warehouseId,
                                                                 record,
                                                                 selectedItems,
                                                                 canAdjustReserved = false,
                                                                 onSuccess,
                                                               }) => {
  const {
    loading,
    error,
    isSuccess,
    adjustResponse,
    adjustQuantities,
    resetAdjustQuantityState,
  } = useWarehouseInventoryAdjustQuantity();
  
  const singleRecord =
    record ?? (selectedItems?.length === 1 ? selectedItems[0] : undefined);
  const isBatch = (selectedItems?.length ?? 0) > 1;
  
  const handleClose = useCallback(() => {
    resetAdjustQuantityState();
    onClose();
  }, [resetAdjustQuantityState, onClose]);
  
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const handledRef = useRef(false);
  
  // Reset the success guard on each open so a second adjustment in the
  // same modal session still fires the snackbar.
  useEffect(() => {
    if (open) handledRef.current = false;
  }, [open]);
  
  useEffect(() => {
    if (!isSuccess) return;
    if (handledRef.current) return;
    handledRef.current = true;
    onSuccessRef.current?.(adjustResponse?.message);
    handleClose();
  }, [isSuccess, adjustResponse, handleClose]);
  
  const handleSingleSubmit = (values: Record<string, any>) => {
    if (!singleRecord) return;
    void adjustQuantities(
      warehouseId,
      buildSingleAdjustPayload(singleRecord.id, values, canAdjustReserved)
    );
  };
  
  const handleBatchSubmit = (rows: Record<string, any>[]) => {
    void adjustQuantities(
      warehouseId,
      buildBatchAdjustPayload(rows, canAdjustReserved)
    );
  };
  
  const title = isBatch
    ? `Adjust Quantities — ${selectedItems!.length} records`
    : 'Adjust Quantity';
  
  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {error && <ErrorMessage message={error} />}
      
      {isBatch && selectedItems ? (
        <BatchAdjustForm
          items={selectedItems}
          canAdjustReserved={canAdjustReserved}
          loading={loading}
          onSubmit={handleBatchSubmit}
          onCancel={handleClose}
        />
      ) : singleRecord ? (
        <SingleRecordAdjustForm
          record={singleRecord}
          canAdjustReserved={canAdjustReserved}
          loading={loading}
          onSubmit={handleSingleSubmit}
        />
      ) : null}
    </CustomModal>
  );
};

export default AdjustQuantitiesModal;
