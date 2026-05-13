/**
 * Payload builders for the warehouse-inventory bulk update-status endpoint.
 *
 * Both code paths — single-record (detail page, or a one-row list selection)
 * and batch (multi-row list selection) — hit the same backend route, which
 * accepts an `updates[]` array of `{ id, statusId }`. These helpers shape
 * loose form state into that contract so the modal stays agnostic to the
 * record's source shape.
 *
 * Exports:
 *   - buildBatchUpdateStatusPayload
 *   - buildSingleUpdateStatusPayload
 */

import type {
  UpdateStatusFormItem,
  UpdateWarehouseInventoryStatusRequest,
} from '@features/warehouseInventory';

/**
 * One row of BatchUpdateStatusForm's react-hook-form state.
 *
 * The index signature is intentional — rows carry extra display fields
 * (lookup labels, batch metadata) that the builder ignores.
 */
type UpdateStatusFormRow = {
  id?: string;
  statusId?: string;
  [key: string]: unknown;
};

/**
 * Submit values from SingleUpdateStatusForm.
 *
 * The index signature is intentional — values carry extra display fields
 * that the builder ignores. Same rationale as UpdateStatusFormRow.
 */
type UpdateStatusFormValues = {
  statusId?: string;
  [key: string]: unknown;
};

/**
 * Builds the bulk update-status request body from BatchUpdateStatusForm rows.
 *
 * The `as string` casts coerce form-optional fields that are guaranteed
 * present by validation before this runs.
 */
export const buildBatchUpdateStatusPayload = (
  rows: UpdateStatusFormRow[]
): UpdateWarehouseInventoryStatusRequest => ({
  updates: rows.map((row) => ({
    id: row.id as string,
    statusId: row.statusId as string,
  })),
});

/**
 * Builds the bulk update-status request body from a normalized form item
 * and SingleUpdateStatusForm's submit values.
 *
 * Wraps a single entry in the same `updates[]` shape used by the batch
 * builder so both code paths hit one route. The `as string` cast coerces
 * a form-optional field guaranteed present by validation.
 */
export const buildSingleUpdateStatusPayload = (
  item: UpdateStatusFormItem,
  values: UpdateStatusFormValues
): UpdateWarehouseInventoryStatusRequest => ({
  updates: [
    {
      id: item.id,
      statusId: values.statusId as string,
    },
  ],
});
