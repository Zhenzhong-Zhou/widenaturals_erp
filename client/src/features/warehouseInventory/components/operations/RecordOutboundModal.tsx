import { type FC, useEffect, useRef } from 'react';
import {
  CustomModal,
  CustomForm,
  CustomMiniTable,
  CustomTypography,
  ErrorMessage,
  Section,
  SummaryStat,
  CustomDatePicker,
} from '@components/index';
import type { CustomFormRef } from '@components/common/CustomForm';
import { useWarehouseInventoryOutbound } from '@hooks/index';
import type { WarehouseInventoryDetailRecord } from '@features/warehouseInventory';
import { toISODate } from '@utils/dateTimeUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecordOutboundModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  record: WarehouseInventoryDetailRecord;
  onSuccess?: () => void;
}

// ─── Zone table columns ───────────────────────────────────────────────────────

const ZONE_COLUMNS = [
  { id: 'zoneCode', label: 'Zone' },
  { id: 'quantity', label: 'Qty' },
  { id: 'reservedQuantity', label: 'Reserved' },
  { id: 'availableQuantity', label: 'Available' },
];

// ─── Fields ───────────────────────────────────────────────────────────────────

const buildFields = (record: WarehouseInventoryDetailRecord) => [
  {
    id: 'outboundDate',
    label: 'Outbound Date',
    type: 'custom' as const,
    required: true,
    defaultValue: toISODate(new Date()),
    customRender: ({ value, onChange }: any) => (
      <CustomDatePicker
        label="Outbound Date"
        required
        value={value ?? null}
        onChange={(date) => onChange?.(toISODate(date))}
      />
    ),
  },
  {
    id: 'warehouseQuantity',
    label: 'Remaining Quantity After Outbound',
    type: 'number' as const,
    required: true,
    min: 0,
    max: record.warehouseQuantity,
    defaultHelperText: `Cannot exceed current qty (${record.warehouseQuantity})`,
    placeholder: '0',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const RecordOutboundModal: FC<RecordOutboundModalProps> = ({
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
    outboundResponse,
    recordOutbound,
    resetOutboundState,
  } = useWarehouseInventoryOutbound();

  const formRef = useRef<CustomFormRef>(null);

  useEffect(() => {
    if (outboundResponse) {
      formRef.current?.resetForm();
      onClose();
      onSuccess?.();
    }
  }, [outboundResponse]);

  const handleClose = () => {
    formRef.current?.resetForm();
    onClose();
  };

  const onSubmit = (values: Record<string, any>) => {
    void recordOutbound(warehouseId, {
      updates: [
        {
          id: record.id,
          outboundDate: values.outboundDate,
          warehouseQuantity: Number(values.warehouseQuantity),
        },
      ],
    });
  };

  return (
    <CustomModal open={open} onClose={handleClose} title="Record Outbound">
      {/* Current quantity context */}
      <Section>
        <SummaryStat label="Warehouse Qty" value={record.warehouseQuantity} />
        <SummaryStat label="Reserved Qty" value={record.reservedQuantity} />
        <SummaryStat label="Available Qty" value={record.availableQuantity} />
      </Section>

      {/* Zone breakdown — read-only context */}
      {record.zones.length > 0 && (
        <Section>
          <CustomTypography variant="subtitle2">
            Zone Breakdown
          </CustomTypography>
          <CustomMiniTable columns={ZONE_COLUMNS} data={record.zones} />
        </Section>
      )}

      {error && <ErrorMessage message={error} />}

      <CustomForm
        ref={formRef}
        fields={buildFields(record)}
        onSubmit={onSubmit}
        submitButtonLabel="Record Outbound"
        disabled={loading}
      />
    </CustomModal>
  );
};

export default RecordOutboundModal;
