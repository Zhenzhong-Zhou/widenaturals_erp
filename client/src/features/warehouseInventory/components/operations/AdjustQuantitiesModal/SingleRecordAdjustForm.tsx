import type { FC } from 'react';
import { CustomForm, Section, SummaryStat } from '@components/index';
import { buildSingleFields } from './adjustQuantitiesFields';

interface AdjustableSingleRecord {
  id: string;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

interface SingleRecordAdjustFormProps {
  record: AdjustableSingleRecord;
  canAdjustReserved: boolean;
  loading: boolean;
  onSubmit: (values: Record<string, any>) => void;
}

/**
 * Single-record variant of the adjust-quantities form.
 *
 * Renders a summary of the record's current quantities followed by an
 * editable form. Uses CustomForm's built-in submit button rather than
 * an external one, since this mode does not need the cancel /
 * submit-all footer pattern of the batch variant.
 *
 * The record prop is typed structurally so callers can pass either a
 * WarehouseInventoryDetailRecord (from the detail page) or a
 * FlattenedWarehouseInventory (when batch mode collapses to one row).
 */
const SingleRecordAdjustForm: FC<SingleRecordAdjustFormProps> = ({
  record,
  canAdjustReserved,
  loading,
  onSubmit,
}) => (
  <>
    <Section>
      <SummaryStat label="Current Warehouse" value={record.warehouseQuantity} />
      <SummaryStat label="Current Reserved" value={record.reservedQuantity} />
      <SummaryStat label="Current Available" value={record.availableQuantity} />
    </Section>

    <CustomForm
      fields={buildSingleFields(record, canAdjustReserved)}
      initialValues={{
        warehouseQuantity: record.warehouseQuantity,
        reservedQuantity: record.reservedQuantity,
      }}
      onSubmit={onSubmit}
      submitButtonLabel="Apply Adjustment"
      disabled={loading}
    />
  </>
);

export default SingleRecordAdjustForm;
