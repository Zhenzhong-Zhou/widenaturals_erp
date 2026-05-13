import { useHasPermissionBoolean } from '@features/authorize/hooks';

export interface WarehouseInventoryPermissions {
  // Read
  canViewInventoryDetail: boolean;
  canViewWarehouseSummary: boolean;
  canViewWarehouseItemsSummary: boolean;
  canViewInventoryActivityLog: boolean;
  // Write
  canCreateInventory: boolean;
  canAdjustInventory: boolean;
  canAdjustReserved: boolean;
  canUpdateInventoryStatus: boolean;
  canEditInventoryMetadata: boolean;
  canRecordOutbound: boolean;
}

/**
 * Resolves all warehouse-inventory permission flags for the current user.
 * Both list and detail pages consume this to keep the ACL surface in one place.
 */
const useWarehouseInventoryPermissions = (): WarehouseInventoryPermissions => {
  const hasPermission = useHasPermissionBoolean();
  
  return {
    canViewInventoryDetail: hasPermission('view_warehouse_inventory_detail'),
    canViewWarehouseSummary: hasPermission('view_warehouse_inventory_summary'),
    canViewWarehouseItemsSummary: hasPermission(
      'view_warehouse_inventory_summary_item_details'
    ),
    canViewInventoryActivityLog: hasPermission(
      'view_warehouse_inventory_activity_log'
    ),
    canCreateInventory: hasPermission('create_warehouse_inventory'),
    canAdjustInventory: hasPermission('adjust_warehouse_inventory'),
    canAdjustReserved: hasPermission('force_adjust_reserved'),
    canUpdateInventoryStatus: hasPermission(
      'update_warehouse_inventory_status'
    ),
    canEditInventoryMetadata: hasPermission(
      'update_warehouse_inventory_metadata'
    ),
    canRecordOutbound: hasPermission('record_warehouse_inventory_outbound'),
  };
};

export default useWarehouseInventoryPermissions;
