import { useCallback, useEffect, useMemo, useRef } from 'react';
import { CustomModal, ErrorMessage } from '@components/index';
import { useWarehouseInventoryUpdateStatus } from '@hooks/index';
import type {
  FlattenedWarehouseInventory,
  UpdateStatusFormItem,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';
import {
  buildBatchUpdateStatusPayload,
  buildSingleUpdateStatusPayload,
} from './updateStatusPayload';
import { getUpdateStatusModalTitle } from './updateStatusItemUtils';
import { useUpdateStatusOptions } from './useUpdateStatusOptions';
import SingleUpdateStatusForm from './SingleUpdateStatusForm';
import BatchUpdateStatusForm from './BatchUpdateStatusForm';
import {
  detailRecordToUpdateStatusItem,
  flattenedToUpdateStatusItem,
} from '@features/warehouseInventory/utils';

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;

  /**
   * Single mode (detail page): pass `record`.
   * Batch mode (list page): pass `selectedItems`.
   * Mutually exclusive — only one should be provided per open.
   */
  record?: WarehouseInventoryDetailRecord;
  selectedItems?: FlattenedWarehouseInventory[];
  onSuccess?: (message?: string) => void;
}

const UpdateStatusModal = ({
  open,
  onClose,
  warehouseId,
  record,
  selectedItems,
  onSuccess,
}: UpdateStatusModalProps) => {
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

  const isBatch = (selectedItems?.length ?? 0) > 1;
  const singleItem = useMemo<UpdateStatusFormItem | undefined>(() => {
    if (record) return detailRecordToUpdateStatusItem(record);
    if (selectedItems?.length !== 1) return undefined;
    const [first] = selectedItems;
    return first ? flattenedToUpdateStatusItem(first) : undefined;
  }, [record, selectedItems]);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const handledRef = useRef(false);

  useEffect(() => {
    if (open) handledRef.current = false;
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
      void updateStatuses(warehouseId, buildBatchUpdateStatusPayload(rows));
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

  const title = useMemo(() => {
    if (isBatch && selectedItems)
      return getUpdateStatusModalTitle(selectedItems);
    return 'Update Status';
  }, [isBatch, selectedItems]);

  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {updateError && <ErrorMessage message={updateError} />}

      {isBatch && selectedItems ? (
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
