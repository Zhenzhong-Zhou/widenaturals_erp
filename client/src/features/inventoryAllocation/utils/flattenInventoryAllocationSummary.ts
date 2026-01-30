import type {
  FlattenedInventoryAllocationSummary,
  InventoryAllocationSummary
} from '@features/inventoryAllocation';

/**
 * Flattens an inventory allocation summary record into a UI-friendly structure.
 *
 * - Extracts nested order, payment, warehouse, and allocation status fields
 * - Preserves backend-provided values without applying defaults or validation
 * - Intended for list and table views (summary-level data only)
 *
 * This transformer assumes the input record is already normalized
 * and complete at the domain/service layer.
 */
export const flattenInventoryAllocationSummary = (
  record: InventoryAllocationSummary
): FlattenedInventoryAllocationSummary => ({
  orderId: record.orderId,
  orderNumber: record.orderNumber,
  orderType: record.orderType,
  orderCategory: record.orderCategory,
  
  orderStatusName: record.orderStatus.name,
  orderStatusCode: record.orderStatus.code,
  
  customerName: record.customer.fullName,
  
  paymentMethod: record.paymentMethod,
  paymentStatusName: record.paymentStatus.name,
  paymentStatusCode: record.paymentStatus.code,
  
  deliveryMethod: record.deliveryMethod,
  
  orderCreatedAt: record.orderCreatedAt,
  orderCreatedBy: record.orderCreatedBy,
  orderUpdatedAt: record.orderUpdatedAt,
  orderUpdatedBy: record.orderUpdatedBy,
  
  totalItemCount: record.itemCount.total,
  allocatedItemCount: record.itemCount.allocated,
  
  warehouseIds: record.warehouses.ids,
  warehouseNames: record.warehouses.names,
  
  allocationStatusCodes: record.allocationStatus.codes,
  allocationStatusNames: record.allocationStatus.names,
  allocationSummaryStatus: record.allocationStatus.summary,
  
  allocationIds: record.allocationIds,
  allocatedAt: record.allocatedAt,
  allocatedCreatedAt: record.allocatedCreatedAt,
});
