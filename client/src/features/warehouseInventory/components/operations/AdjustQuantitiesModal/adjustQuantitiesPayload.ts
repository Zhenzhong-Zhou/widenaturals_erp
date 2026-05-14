import type { AdjustWarehouseInventoryQuantityRequest } from '@features/warehouseInventory';

/**
 * Single-record variant of the adjust-quantities payload.
 *
 * Wraps a single update in the same `{ updates: [...] }` envelope the
 * backend accepts for batch adjustments — one endpoint serves both
 * modes. `reservedQuantity` is gated on the FORCE_ADJUST_RESERVED
 * permission via `canAdjustReserved`; when the caller lacks the
 * permission the field is omitted entirely rather than sent as null.
 */
export const buildSingleAdjustPayload = (
  id: string,
  values: Record<string, any>,
  canAdjustReserved: boolean
): AdjustWarehouseInventoryQuantityRequest => ({
  updates: [
    {
      id,
      warehouseQuantity: Number(values.warehouseQuantity),
      ...(canAdjustReserved && {
        reservedQuantity: Number(values.reservedQuantity),
      }),
    },
  ],
});

/**
 * Batch variant of the adjust-quantities payload.
 *
 * Same envelope shape as {@link buildSingleAdjustPayload} — one
 * endpoint, two callers. `reservedQuantity` is permission-gated as in
 * the single variant, but additionally guards against the empty-string
 * sentinel MultiItemForm leaves behind for unfilled number inputs,
 * which would coerce to NaN through Number().
 */
export const buildBatchAdjustPayload = (
  rows: Record<string, any>[],
  canAdjustReserved: boolean
): AdjustWarehouseInventoryQuantityRequest => ({
  updates: rows.map((row) => ({
    id: row.id,
    warehouseQuantity: Number(row.warehouseQuantity),
    ...(canAdjustReserved &&
      row.reservedQuantity !== '' && {
        reservedQuantity: Number(row.reservedQuantity),
      }),
  })),
});
