import { type FC, useEffect, useRef } from 'react';
import {
  CustomModal,
  ErrorMessage,
} from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
  type MultiItemFieldConfig,
} from '@components/common/MultiItemForm';
import { useWarehouseInventoryCreate } from '@hooks/index';
import type { CreateWarehouseInventoryRequest } from '@features/warehouseInventory';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatusOption {
  value: string;
  label: string;
}

interface CreateInventoryModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  statusOptions: StatusOption[];
  onSuccess?: () => void;
}

// ─── Fields ───────────────────────────────────────────────────────────────────

const buildFields = (statusOptions: StatusOption[]): MultiItemFieldConfig[] => [
  {
    id: 'batchId',
    label: 'Batch ID',
    type: 'text',
    required: true,
    placeholder: 'Batch UUID',
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'warehouseQuantity',
    label: 'Quantity',
    type: 'number',
    required: true,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number',
    required: false,
    placeholder: '0.00',
    grid: { xs: 12, sm: 4 },
  },
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'date',
    required: false,
    grid: { xs: 12, sm: 4 },
  },
  {
    id: 'statusId',
    label: 'Status',
    type: 'select',
    required: false,
    options: statusOptions,
    grid: { xs: 12, sm: 4 },
  },
];

// ─── Payload builder ──────────────────────────────────────────────────────────

const buildPayload = (rows: Record<string, any>[]): CreateWarehouseInventoryRequest => ({
  records: rows.map((r) => ({
    batchId: r.batchId,
    warehouseQuantity: Number(r.warehouseQuantity),
    ...(r.warehouseFee !== '' && r.warehouseFee != null && {
      warehouseFee: Number(r.warehouseFee),
    }),
    ...(r.inboundDate && { inboundDate: r.inboundDate }),
    ...(r.statusId && { statusId: r.statusId }),
  })),
});

// ─── Component ────────────────────────────────────────────────────────────────

const CreateInventoryModal: FC<CreateInventoryModalProps> = ({
                                                                     open,
                                                                     onClose,
                                                                     warehouseId,
                                                                     statusOptions,
                                                                     onSuccess,
                                                                   }) => {
  const {
    loading,
    error,
    createResponse,
    createWarehouseInventory,
  } = useWarehouseInventoryCreate();
  
  const formRef = useRef<MultiItemFormRef>(null);
  
  useEffect(() => {
    if (createResponse) {
      onClose();
      onSuccess?.();
    }
  }, [createResponse]);
  
  const handleClose = () => {
    onClose();
  };
  
  const onSubmit = (rows: Record<string, any>[]) => {
    void createWarehouseInventory(warehouseId, buildPayload(rows));
  };
  
  return (
    <CustomModal open={open} onClose={handleClose} title="Add Inventory Records">
      {error && <ErrorMessage message={error} />}
      
      <MultiItemForm
        ref={formRef}
        fields={buildFields(statusOptions)}
        onSubmit={onSubmit}
        loading={loading}
        showSubmitButton
        getItemTitle={(index) => `Record ${index + 1}`}
      />
    </CustomModal>
  );
};

export default CreateInventoryModal;
