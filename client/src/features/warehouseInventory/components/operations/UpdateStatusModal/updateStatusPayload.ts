import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

type UpdateStatusFormRow = {
  id?: string;
  statusId?: string;
  [key: string]: unknown;
};

type UpdateStatusFormValues = {
  statusId?: string;
  [key: string]: unknown;
};

export const buildBatchUpdateStatusPayload = (
  rows: UpdateStatusFormRow[]
) => ({
  updates: rows.map((row) => ({
    id: row.id as string,
    statusId: row.statusId as string,
  })),
});

export const buildSingleUpdateStatusPayload = (
  item: FlattenedWarehouseInventory,
  values: UpdateStatusFormValues
) => ({
  updates: [
    {
      id: item.id,
      statusId: values.statusId as string,
    },
  ],
});
