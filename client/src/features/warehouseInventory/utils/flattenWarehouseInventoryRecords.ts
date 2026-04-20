import type {
  WarehouseInventoryRecord,
  FlattenedWarehouseInventory,
} from '@features/warehouseInventory';

/**
 * Flattens warehouse inventory records into a table-friendly structure.
 *
 * Includes:
 *  - Core inventory (id, batchId, batchType, quantities, fee, dates)
 *  - Status info (statusId, statusName, statusDate)
 *  - Product info (lotNumber, sku, barcode, productName, brand, manufacturer)
 *  - Packaging info (packagingLotNumber, materialCode, supplierName)
 *
 * Product and packaging fields are mutually exclusive based on batchType.
 *
 * @param records - Array of WarehouseInventoryRecord returned from the API
 * @returns Flat array of FlattenedWarehouseInventory
 */
export const flattenWarehouseInventoryRecords = (
  records: WarehouseInventoryRecord[]
): FlattenedWarehouseInventory[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    const status = record.status ?? { id: '', name: '—', date: null };
    const product = record.productInfo;
    const packaging = record.packagingInfo;
    
    return {
      // ------------------------------
      // Core Inventory
      // ------------------------------
      id:                record.id                ?? '',
      batchId:           record.batchId           ?? '',
      batchType:         record.batchType         ?? '—',
      warehouseQuantity: record.warehouseQuantity ?? 0,
      reservedQuantity:  record.reservedQuantity  ?? 0,
      availableQuantity: record.availableQuantity ?? 0,
      warehouseFee:      record.warehouseFee      ?? '0.00',
      inboundDate:       record.inboundDate       ?? '',
      outboundDate:      record.outboundDate      ?? null,
      lastMovementAt:    record.lastMovementAt    ?? null,
      
      // ------------------------------
      // Status
      // ------------------------------
      statusId:   status.id   ?? '',
      statusName: status.name ?? '—',
      statusDate: status.date ?? null,
      
      // ------------------------------
      // Product (null when packaging_material)
      // ------------------------------
      productBatchId:   product?.batch?.id            ?? null,
      lotNumber:        product?.batch?.lotNumber     ?? null,
      skuId:            product?.sku?.id              ?? null,
      sku:              product?.sku?.sku             ?? null,
      barcode:          product?.sku?.barcode         ?? null,
      sizeLabel:        product?.sku?.sizeLabel       ?? null,
      countryCode:      product?.sku?.countryCode     ?? null,
      marketRegion:     product?.sku?.marketRegion    ?? null,
      productId:        product?.product?.id          ?? null,
      productName:      product?.product?.name        ?? null,
      displayName:      product?.product?.displayName ?? null,
      brand:            product?.product?.brand       ?? null,
      manufacturerId:   product?.manufacturer?.id     ?? null,
      manufacturerName: product?.manufacturer?.name   ?? null,
      
      // ------------------------------
      // Packaging (null when product)
      // ------------------------------
      packagingBatchId:   packaging?.batch?.id         ?? null,
      packagingLotNumber: packaging?.batch?.lotNumber   ?? null,
      materialId:         packaging?.material?.id       ?? null,
      materialCode:       packaging?.material?.code     ?? null,
      supplierId:         packaging?.supplier?.id       ?? null,
      supplierName:       packaging?.supplier?.name     ?? null,
    };
  });
};
