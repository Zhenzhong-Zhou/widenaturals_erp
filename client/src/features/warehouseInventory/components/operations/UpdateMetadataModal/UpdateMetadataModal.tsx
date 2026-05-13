import { useRef } from 'react';
import {
  CustomForm,
  CustomModal,
  ErrorMessage,
} from '@components/index';
import type { CustomFormRef } from '@components/common/CustomForm';
import { useWarehouseInventoryUpdateMetadata } from '@hooks/index';
import { useModalSuccessLifecycle } from '@features/warehouseInventory/hooks';
import type { WarehouseInventoryDetailRecord } from '@features/warehouseInventory';
import { buildUpdateMetadataFields } from './updateMetadataFields';
import { buildUpdateMetadataPayload } from './updateMetadataPayload';

interface UpdateMetadataModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  record: WarehouseInventoryDetailRecord;
  onSuccess?: (message: string) => void;
}

const UpdateMetadataModal = ({
                               open,
                               onClose,
                               warehouseId,
                               record,
                               onSuccess,
                             }: UpdateMetadataModalProps) => {
  const {
    loading,
    error,
    success,
    updateResponse,
    updateMetadata,
    resetUpdateMetadataState,
  } = useWarehouseInventoryUpdateMetadata();
  
  const formRef = useRef<CustomFormRef>(null);
  
  const { handleClose } = useModalSuccessLifecycle({
    open,
    success,
    message: updateResponse?.message,
    fallbackMessage: 'Inventory metadata updated successfully.',
    onClose,
    onSuccess,
    resetState: resetUpdateMetadataState,
    formRef,
  });
  
  const onSubmit = (values: Record<string, any>) => {
    const payload = buildUpdateMetadataPayload(values, record);
    if (Object.keys(payload).length === 0) {
      handleClose();
      return;
    }
    void updateMetadata(warehouseId, record.id, payload);
  };
  
  return (
    <CustomModal open={open} onClose={handleClose} title="Edit Metadata">
      {error && <ErrorMessage message={error} />}
      
      <CustomForm
        ref={formRef}
        fields={buildUpdateMetadataFields(record)}
        onSubmit={onSubmit}
        submitButtonLabel="Save Changes"
        disabled={loading}
      />
    </CustomModal>
  );
};

export default UpdateMetadataModal;
