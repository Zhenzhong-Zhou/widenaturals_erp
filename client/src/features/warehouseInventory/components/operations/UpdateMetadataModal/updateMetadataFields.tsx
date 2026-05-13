import { CustomDatePicker } from '@components/index';
import { toISODate } from '@utils/dateTimeUtils';
import type { WarehouseInventoryDetailRecord } from '@features/warehouseInventory';

/**
 * Field configuration for the Edit Metadata form.
 *
 * Both fields are optional — empty submissions are treated as no-ops by
 * buildUpdateMetadataPayload. The custom render for inboundDate is needed
 * because CustomForm does not have a native date type.
 */
export const buildUpdateMetadataFields = (
  record: WarehouseInventoryDetailRecord
) => [
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'custom' as const,
    required: false,
    defaultValue: toISODate(record.inboundDate),
    fullWidth: true,
    grid: { xs: 12 },
    customRender: ({ value, onChange }: any) => (
      <CustomDatePicker
        label="Inbound Date"
        value={value ?? null}
        onChange={(date) => onChange?.(toISODate(date))}
      />
    ),
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number' as const,
    required: false,
    min: 0,
    defaultValue: record.warehouseFee,
    placeholder: '0.00',
    fullWidth: true,
    grid: { xs: 12 },
  },
];
