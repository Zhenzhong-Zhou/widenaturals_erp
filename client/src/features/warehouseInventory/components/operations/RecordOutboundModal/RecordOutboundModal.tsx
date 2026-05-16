import { useRef } from 'react';
import {
  CustomModal,
  CustomForm,
  CustomMiniTable,
  CustomTypography,
  ErrorMessage,
  Section,
  SummaryStat,
} from '@components/index';
import type { CustomFormRef } from '@components/common/CustomForm';
import { useWarehouseInventoryOutbound } from '@hooks/index';
import { useModalSuccessLifecycle } from '@features/warehouseInventory/hooks';
import type { WarehouseInventoryDetailRecord } from '@features/warehouseInventory';
import { buildRecordOutboundFields } from './recordOutboundFields';
import { buildRecordOutboundPayload } from './recordOutboundPayload';

interface RecordOutboundModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  record: WarehouseInventoryDetailRecord;
  onSuccess?: (message: string) => void;
}

const ZONE_COLUMNS = [
  { id: 'zoneCode', label: 'Zone' },
  { id: 'quantity', label: 'Qty' },
  { id: 'reservedQuantity', label: 'Reserved' },
  { id: 'availableQuantity', label: 'Available' },
];

const RecordOutboundModal = ({
  open,
  onClose,
  warehouseId,
  record,
  onSuccess,
}: RecordOutboundModalProps) => {
  const {
    loading,
    error,
    success,
    outboundResponse,
    recordOutbound,
    resetOutboundState,
  } = useWarehouseInventoryOutbound();

  const formRef = useRef<CustomFormRef>(null);

  const { handleClose } = useModalSuccessLifecycle({
    open,
    success,
    message: outboundResponse?.message,
    fallbackMessage: 'Outbound movement recorded successfully.',
    onClose,
    onSuccess,
    resetState: resetOutboundState,
    formRef,
  });

  const onSubmit = (values: Record<string, any>) => {
    void recordOutbound(
      warehouseId,
      buildRecordOutboundPayload(record, values)
    );
  };

  return (
    <CustomModal open={open} onClose={handleClose} title="Record Outbound">
      <Section>
        <SummaryStat label="Warehouse Qty" value={record.warehouseQuantity} />
        <SummaryStat label="Reserved Qty" value={record.reservedQuantity} />
        <SummaryStat label="Available Qty" value={record.availableQuantity} />
      </Section>

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
        fields={buildRecordOutboundFields(record)}
        onSubmit={onSubmit}
        submitButtonLabel="Record Outbound"
        disabled={loading}
      />
    </CustomModal>
  );
};

export default RecordOutboundModal;
