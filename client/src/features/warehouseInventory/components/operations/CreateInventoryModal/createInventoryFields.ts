import type { MultiItemFieldConfig } from '@components/common/MultiItemForm';
import BatchIdCell from './BatchIdCell';

interface StatusOption {
  value: string;
  label: string;
}

/**
 * MultiItemForm field definitions for CreateInventoryModal.
 * Pure factory — accepts the dynamic status options and returns the
 * full field list. Field rendering for the batch picker is delegated
 * to BatchIdCell, which reads its state from BatchLookupContext.
 */
export const buildCreateInventoryFields = (
  statusOptions: StatusOption[]
): MultiItemFieldConfig[] => [
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
    type: 'select',
    required: false,
    options: statusOptions,
    group: 'date-status',
    grid: { xs: 6 },
  },
];
