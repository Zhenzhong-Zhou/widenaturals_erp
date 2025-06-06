import type {
  ApiSuccessResponse,
  AsyncState,
  DropdownSuccessResponse,
  PaginatedDropdownState,
} from '@shared-types/api.ts';

export interface GetBatchRegistryDropdownParams {
  /**
   * Filter by batch type (e.g., 'product', 'packaging_material')
   */
  batchType?: 'product' | 'packaging_material' | string;

  /**
   * Optional warehouse ID to exclude batches already present in this warehouse
   */
  warehouseId?: string;

  /**
   * Optional location ID to exclude batches already present in this location
   */
  locationId?: string;

  /**
   * Number of items to retrieve (pagination limit)
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;
}

export interface ProductBatchDropdownItem {
  id: string;
  type: 'product';
  product: {
    id: string;
    name: string;
    lotNumber: string;
    expiryDate: string;
  };
}

export interface PackagingMaterialDropdownItem {
  id: string;
  type: 'packaging_material';
  packagingMaterial: {
    id: string;
    lotNumber: string;
    expiryDate: string;
    snapshotName: string;
    receivedLabel: string;
  };
}

export type BatchRegistryDropdownItem =
  | ProductBatchDropdownItem
  | PackagingMaterialDropdownItem;

export type GetBatchRegistryDropdownResponse =
  DropdownSuccessResponse<BatchRegistryDropdownItem>;

export type BatchRegistryDropdownState =
  PaginatedDropdownState<BatchRegistryDropdownItem>;

export interface WarehouseDropdownItem {
  value: string;
  label: string;
  metadata: {
    locationId: string;
    locationTypeId: string;
  };
}

export type GetWarehouseDropdownResponse = ApiSuccessResponse<
  WarehouseDropdownItem[]
>;

export interface GetWarehouseDropdownFilters {
  locationTypeId?: string;
  warehouseTypeId?: string;
  includeArchived?: boolean;
}

export type WarehouseDropdownState = AsyncState<WarehouseDropdownItem[]>;

export interface WarehouseOption {
  label: string;
  value: string;
}

/**
 * Represents a single option in the lot adjustment dropdown.
 */
export interface LotAdjustmentTypeDropdownItem {
  /**
   * The unique identifier of the lot adjustment type.
   * Used as the `value` in dropdown menus.
   */
  value: string;
  
  /**
   * The display label of the lot adjustment type.
   * Typically shown as the visible text in the dropdown option.
   */
  label: string;
  
  /**
   * The unique identifier of the related inventory action type.
   * Used for internal mapping or further logic.
   */
  actionTypeId: string;
}

/**
 * Typed API response for fetching lot adjustment dropdown options.
 */
export type LotAdjustmentTypeDropdownResponse = ApiSuccessResponse<LotAdjustmentTypeDropdownItem[]>;

export type LotAdjustmentTypeDropdownState = AsyncState<LotAdjustmentTypeDropdownItem[]>;
