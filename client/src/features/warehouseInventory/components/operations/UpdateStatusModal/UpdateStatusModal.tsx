import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  CustomModal,
  ErrorMessage,
} from '@components/index';
import { useWarehouseInventoryUpdateStatus } from '@hooks/index';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import {
  buildBatchUpdateStatusPayload,
  buildSingleUpdateStatusPayload,
} from './updateStatusPayload';
import {
  getUpdateStatusModalTitle,
} from './updateStatusItemUtils';
import { useUpdateStatusOptions } from './useUpdateStatusOptions';
import SingleUpdateStatusForm from './SingleUpdateStatusForm';
import BatchUpdateStatusForm from './BatchUpdateStatusForm';

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  
  /**
   * Single mode (detail page): pass one item.
   * Batch mode (list page): pass multiple items.
   */
  selectedItems: FlattenedWarehouseInventory[];
  
  onSuccess?: (message?: string) => void;
}

const UpdateStatusModal: FC<UpdateStatusModalProps> = ({
                                                         open,
                                                         onClose,
                                                         warehouseId,
                                                         selectedItems,
                                                         onSuccess,
                                                       }) => {
  const {
    loading: updateLoading,
    error: updateError,
    success,
    updateResponse,
    updateStatuses,
    resetUpdateStatusState,
  } = useWarehouseInventoryUpdateStatus();
  
  const {
    statusOptions,
    statusLoading,
    statusError,
    statusPaginationMeta,
    statusFetchParams,
    setStatusFetchParams,
    fetchStatusOptions,
  } = useUpdateStatusOptions(open);
  
  const isBatch = selectedItems.length > 1;
  const singleItem = !isBatch ? selectedItems[0] : undefined;
  
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  
  const handledRef = useRef(false);
  
  useEffect(() => {
    if (open) {
      handledRef.current = false;
    }
  }, [open]);
  
  const handleClose = useCallback(() => {
    resetUpdateStatusState();
    onClose();
  }, [resetUpdateStatusState, onClose]);
  
  useEffect(() => {
    if (!success) return;
    if (handledRef.current) return;
    
    handledRef.current = true;
    
    onSuccessRef.current?.(
      updateResponse?.message ?? 'Inventory status updated successfully.'
    );
    
    handleClose();
  }, [success, updateResponse?.message, handleClose]);
  
  const handleBatchSubmit = useCallback(
    (rows: Record<string, any>[]) => {
      void updateStatuses(
        warehouseId,
        buildBatchUpdateStatusPayload(rows)
      );
    },
    [updateStatuses, warehouseId]
  );
  
  const handleSingleSubmit = useCallback(
    (values: Record<string, any>) => {
      if (!singleItem) return;
      
      void updateStatuses(
        warehouseId,
        buildSingleUpdateStatusPayload(singleItem, values)
      );
    },
    [singleItem, updateStatuses, warehouseId]
  );
  
  const title = useMemo(
    () => getUpdateStatusModalTitle(selectedItems),
    [selectedItems]
  );
  
  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {updateError && <ErrorMessage message={updateError} />}
      
      {isBatch ? (
        <BatchUpdateStatusForm
          items={selectedItems}
          statusOptions={statusOptions}
          statusLoading={statusLoading}
          loading={updateLoading}
          onSubmit={handleBatchSubmit}
          onCancel={handleClose}
        />
      ) : singleItem ? (
        <SingleUpdateStatusForm
          item={singleItem}
          statusOptions={statusOptions}
          statusLoading={statusLoading}
          statusError={statusError}
          statusPaginationMeta={statusPaginationMeta}
          statusFetchParams={statusFetchParams}
          setStatusFetchParams={setStatusFetchParams}
          fetchStatusOptions={fetchStatusOptions}
          loading={updateLoading}
          onSubmit={handleSingleSubmit}
        />
      ) : null}
    </CustomModal>
  );
};

export default UpdateStatusModal;
