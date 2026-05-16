import { CustomDatePicker } from '@components/index';
import { toISODate } from '@utils/dateTimeUtils';
import type { WarehouseInventoryDetailRecord } from '@features/warehouseInventory';

/**
 * Field configuration for the Record Outbound form.
 *
 * Returns two fields stacked vertically:
 *   - outboundDate: required, defaults to today (custom date picker render).
 *   - warehouseQuantity: required; the remaining qty after outbound,
 *     bounded above by the record's current warehouseQuantity.
 */
export const buildRecordOutboundFields = (
  record: WarehouseInventoryDetailRecord
) => [
  {
    id: 'outboundDate',
    label: 'Outbound Date',
    type: 'custom' as const,
    required: true,
    defaultValue: toISODate(new Date()),
    fullWidth: true,
    grid: { xs: 12 },
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
    fullWidth: true,
    grid: { xs: 12 },
  },
];
