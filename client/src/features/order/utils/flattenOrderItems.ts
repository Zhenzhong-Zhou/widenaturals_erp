import type {
  FlattenedOrderItemRow,
  OrderItem
} from '@features/order';

/**
 * Flattens order items into a canonical, UI-ready structure.
 *
 * This transformation is intended to run once at the thunk
 * boundary before data enters Redux state.
 */
export const flattenOrderItems = (
  items: OrderItem[] = []
): FlattenedOrderItemRow[] => {
  return items.map((item) => {
    const isSkuLine = Boolean(item.sku);
    const audit = item.audit;
    
    return {
      orderItemId: item.id,
      orderId: item.orderId,
      
      itemType: isSkuLine ? 'sku' : 'packaging_material',
      
      itemName:
        item.displayName ??
        item.packagingMaterial?.name ??
        '—',
      
      skuCode: item.sku?.code ?? null,
      barcode: item.barcode ?? null,
      
      packagingMaterialCode: item.packagingMaterial?.code ?? null,
      
      quantityOrdered: item.quantityOrdered,
      
      unitPrice:
        item.price != null ? Number(item.price) : null,
      
      subtotal:
        item.subtotal != null ? Number(item.subtotal) : null,
      
      priceTypeName: item.priceTypeName ?? null,
      
      statusName: item.status?.name ?? '—',
      statusCode: item.status?.code ?? '',
      statusDate: item.status?.date ?? '',
      
      createdAt: audit?.createdAt ?? '',
      createdBy: audit?.createdBy?.name ?? '—',
      updatedAt: audit?.updatedAt ?? '',
      updatedBy: audit?.updatedBy?.name ?? '—',
      
      metadata: item.metadata ?? null,
    };
  });
};
