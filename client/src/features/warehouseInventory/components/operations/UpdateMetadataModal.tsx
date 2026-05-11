import { type FC, useEffect, useRef } from 'react';
import {
  CustomDatePicker,
  CustomForm,
  CustomModal,
  ErrorMessage,
} from '@components/index';
import { useWarehouseInventoryUpdateMetadata } from '@hooks/index';
import type {
  UpdateWarehouseInventoryMetadataRequest,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';
import type { CustomFormRef } from '@components/common/CustomForm';
import { toISODate } from '@utils/dateTimeUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpdateMetadataModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  record: WarehouseInventoryDetailRecord;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildPayload = (
  values: Record<string, any>,
  original: WarehouseInventoryDetailRecord
): UpdateWarehouseInventoryMetadataRequest => {
  const payload: UpdateWarehouseInventoryMetadataRequest = {};
  if (values.inboundDate) payload.inboundDate = values.inboundDate;
  if (
    values.warehouseFee !== '' &&
    values.warehouseFee !== original.warehouseFee
  ) {
    payload.warehouseFee = Number(values.warehouseFee);
  }
  return payload;
};

// ─── Fields ───────────────────────────────────────────────────────────────────

// date type not supported by CustomForm — use custom render for inboundDate
const buildFields = (record: WarehouseInventoryDetailRecord) => [
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'custom' as const,
    required: false,
    customRender: ({ value, onChange }: any) => (
      <CustomDatePicker
        label="Inbound Date"
        value={value ?? null}
        onChange={(date) => onChange?.(toISODate(date))}
      />
    ),
    defaultValue: toISODate(record.inboundDate),
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number' as const,
    required: false,
    min: 0,
    defaultValue: record.warehouseFee,
    placeholder: '0.00',
  },
];
// todo: installHook.js:1 [handleSuccess] called
// {message: undefined}
// overrideMethod	@	installHook.js:1
// todo: need to use reset to fix

// ─── Component ────────────────────────────────────────────────────────────────

const UpdateMetadataModal: FC<UpdateMetadataModalProps> = ({
  open,
  onClose,
  warehouseId,
  record,
  onSuccess,
}) => {
  const {
    loading,
    error,
    success,
    updateResponse,
    updateMetadata,
    resetUpdateMetadataState,
  } = useWarehouseInventoryUpdateMetadata();

  const formRef = useRef<CustomFormRef>(null);

  useEffect(() => {
    if (updateResponse) {
      formRef.current?.resetForm();
      onClose();
      onSuccess?.();
    }
  }, [updateResponse]);

  const handleClose = () => {
    formRef.current?.resetForm();
    onClose();
  };

  const onSubmit = (values: Record<string, any>) => {
    const payload = buildPayload(values, record);
    // Nothing changed — no-op.
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
        fields={buildFields(record)}
        onSubmit={onSubmit}
        submitButtonLabel="Save Changes"
        disabled={loading}
      />
    </CustomModal>
  );
};

export default UpdateMetadataModal;
