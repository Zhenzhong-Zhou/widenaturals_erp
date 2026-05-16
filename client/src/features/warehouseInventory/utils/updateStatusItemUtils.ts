/**
 * Adapters that normalize the two warehouse-inventory record shapes into
 * UpdateStatusFormItem, the single input type consumed by UpdateStatusModal,
 * SingleUpdateStatusForm, and buildSingleUpdateStatusPayload.
 *
 * The list page produces FlattenedWarehouseInventory (flat columns) while
 * the detail page produces WarehouseInventoryDetailRecord (nested objects).
 * Centralizing the conversion here keeps downstream code from branching
 * on the source shape.
 *
 * Exports:
 *   - flattenedToUpdateStatusItem
 *   - detailRecordToUpdateStatusItem
 */

import type {
  FlattenedWarehouseInventory,
  UpdateStatusFormItem,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';
import {
  getDetailRecordInventoryLabel,
  getFlattenedInventoryLabel,
} from '@features/warehouseInventory/components/operations/UpdateStatusModal/updateStatusItemUtils';

/**
 * Adapter: FlattenedWarehouseInventory → UpdateStatusFormItem.
 *
 * Maps the flat status columns (statusId, statusName) to the normalized
 * current-status fields and delegates the display label to
 * getFlattenedInventoryLabel.
 */
export const flattenedToUpdateStatusItem = (
  f: FlattenedWarehouseInventory
): UpdateStatusFormItem => ({
  id: f.id,
  currentStatusId: f.statusId,
  currentStatusName: f.statusName,
  label: getFlattenedInventoryLabel(f),
});

/**
 * Adapter: WarehouseInventoryDetailRecord → UpdateStatusFormItem.
 *
 * Maps the nested status object (status.id, status.name) to the normalized
 * current-status fields and delegates the display label to
 * getDetailRecordInventoryLabel.
 */
export const detailRecordToUpdateStatusItem = (
  r: WarehouseInventoryDetailRecord
): UpdateStatusFormItem => ({
  id: r.id,
  currentStatusId: r.status.id,
  currentStatusName: r.status.name,
  label: getDetailRecordInventoryLabel(r),
});
