import { BASE_SORT_OPTIONS } from '@features/inventoryShared/constants/baseSortOptions.ts';

export const WAREHOUSE_INVENTORY_SORT_OPTIONS = [
  { label: 'Warehouse Name', value: 'warehouseName' },
  ...BASE_SORT_OPTIONS,
];
