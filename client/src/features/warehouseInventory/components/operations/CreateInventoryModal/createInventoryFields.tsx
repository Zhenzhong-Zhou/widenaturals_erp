import type {
  MultiItemFieldConfig,
  RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import BatchIdCell from './BatchIdCell';
import type { LookupOption } from '@features/lookup';
import { StatusCell } from '@features/warehouseInventory/components/shared';

interface BuildCreateInventoryFieldsArgs {
  statusOptions: LookupOption[];
  statusLoading: boolean;
}

/**
 * MultiItemForm field definitions for CreateInventoryModal.
 * Pure factory — accepts the dynamic status options and returns the
 * full field list. Field rendering for the batch picker is delegated
 * to BatchIdCell, which reads its state from BatchLookupContext.
 */
export const buildCreateInventoryFields = ({
  statusOptions,
  statusLoading,
}: BuildCreateInventoryFieldsArgs): MultiItemFieldConfig[] => [
  {
    id: 'batchId',
    label: 'Batch ID',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    component: BatchIdCell,
  },
  {
    id: 'warehouseQuantity',
    label: 'Quantity',
    type: 'number',
    required: true,
    group: 'qty-fee',
    grid: { xs: 6 },
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number',
    required: false,
    group: 'qty-fee',
    placeholder: '$0.00',
    grid: { xs: 6 },
  },
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'date',
    required: false,
    group: 'date-status',
    grid: { xs: 6 },
  },
  {
    id: 'statusId',
    label: 'Status',
    type: 'custom',
    required: false,
    group: 'date-status',
    grid: { xs: 6 },
    component: (props: RowAwareComponentProps) => (
      <StatusCell {...props} options={statusOptions} loading={statusLoading} />
    ),
  },
];
