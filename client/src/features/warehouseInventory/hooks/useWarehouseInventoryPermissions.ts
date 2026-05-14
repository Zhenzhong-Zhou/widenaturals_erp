import { useHasPermissionBoolean } from '@features/authorize/hooks';
import { PERMISSION_KEYS } from '@features/authorize/constants/permissionKeys';

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
    // Read
    canViewInventoryDetail: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_DETAILS
    ),
    canViewWarehouseSummary: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY
    ),
    canViewWarehouseItemsSummary: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY_ITEM_DETAILS
    ),
    canViewInventoryActivityLog: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_ACTIVITY_LOG
    ),

    // Write
    canCreateInventory: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE_INBOUND
    ),
    canAdjustInventory: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.ADJUST_INVENTORY
    ),
    canAdjustReserved: hasPermission('force_adjust_reserved'),
    canUpdateInventoryStatus: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.UPDATE_INVENTORY_STATUS
    ),
    canEditInventoryMetadata: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.EDIT_METADATA
    ),
    canRecordOutbound: hasPermission(
      PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE_OUTBOUND
    ),
  };
};

export default useWarehouseInventoryPermissions;
