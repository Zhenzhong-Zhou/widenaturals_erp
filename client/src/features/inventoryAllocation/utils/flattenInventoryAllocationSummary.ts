import type {
  FlattenedInventoryAllocationSummary,
  InventoryAllocationSummary,
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
  
  orderStatusName: record.orderStatus?.name ?? null,
  orderStatusCode: record.orderStatus?.code ?? null,
  
  customerType: record.customer?.type ?? null,
  customerFirstname: record.customer?.firstname ?? null,
  customerLastname: record.customer?.lastname ?? null,
  customerCompanyName: record.customer?.companyName ?? null,
  customerName: record.customer?.customerName ?? null,
  
  paymentMethod: record.paymentMethod ?? null,
  paymentStatusName: record.paymentStatus?.name ?? null,
  paymentStatusCode: record.paymentStatus?.code ?? null,
  
  deliveryMethod: record.deliveryMethod ?? null,
  
  orderCreatedByFirstname: record.orderCreatedBy?.firstname ?? null,
  orderCreatedByLastname: record.orderCreatedBy?.lastname ?? null,
  orderCreatedBy: record.orderCreatedBy?.fullName ?? null,
  
  orderUpdatedByFirstname: record.orderUpdatedBy?.firstname ?? null,
  orderUpdatedByLastname: record.orderUpdatedBy?.lastname ?? null,
  orderUpdatedBy: record.orderUpdatedBy?.fullName ?? null,
  
  totalItemCount: record.itemCount?.total ?? 0,
  allocatedItemCount: record.itemCount?.allocated ?? 0,
  
  warehouseIds: record.warehouses?.ids ?? [],
  warehouseNames: record.warehouses?.names ?? '',
  
  allocationStatusCodes: record.allocationStatus?.codes ?? [],
  allocationStatusNames: record.allocationStatus?.names ?? '',
  allocationSummaryStatus: record.allocationStatus?.summary ?? 'Unknown',
  
  allocationIds: record.allocationIds ?? [],
  allocatedAt: record.allocatedAt ?? null,
  allocatedCreatedAt: record.allocatedCreatedAt ?? null,
});
