import { WarehouseInventory } from '../features/warehouse-inventory';

export const sanitizeWarehouseInventory = (data: any[]): WarehouseInventory[] => {
  if (!Array.isArray(data)) return [];
  
  return data.filter((row): row is WarehouseInventory =>
    row &&
    typeof row === 'object' &&
    row.warehouse &&
    row.warehouse.name &&
    row.inventory &&
    row.inventory.itemName &&
    row.quantity &&
    row.status &&
    row.dates &&
    row.audit &&
    row.fees
  );
}
