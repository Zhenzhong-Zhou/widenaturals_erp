import type {
  ApiSuccessResponse,
  AsyncState,
  LookupSuccessResponse,
  PaginatedLookupState,
} from '@shared-types/api';

/**
 * Represents a generic option item used in lookup components.
 * Can be reused across forms, selectors, or any UI where value-label pairs are needed.
 */
export interface LookupOption {
  /** Display label shown to the user */
  label: string;
  /** Underlying value submitted or used in logic */
  value: string;
}

export interface GetBatchRegistryLookupParams {
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

/**
 * Query parameters for fetching lot adjustment type lookup options.
 */
export interface LotAdjustmentLookupQueryParams {
  /**
   * Whether to exclude internal-only adjustment types such as
   * 'manual_stock_insert' and 'manual_stock_update'.
   * Defaults to `true` on the server if omitted.
   */
  excludeInternal?: boolean;
  
  /**
   * Whether to restrict results to only quantity adjustment types.
   * Useful for inventory adjustment forms where only quantity-related
   * actions are relevant.
   * Default to `false` if omitted.
   */
  restrictToQtyAdjustment?: boolean;
}

export interface ProductBatchLookupItem {
  id: string;
  type: 'product';
  product: {
    id: string;
    name: string;
    lotNumber: string;
    expiryDate: string;
  };
}

export interface PackagingMaterialLookupItem {
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

export type BatchRegistryLookupItem =
  | ProductBatchLookupItem
  | PackagingMaterialLookupItem;

export type GetBatchRegistryLookupResponse =
  LookupSuccessResponse<BatchRegistryLookupItem>;

export type BatchRegistryLookupState =
  PaginatedLookupState<BatchRegistryLookupItem>;

export interface WarehouseLookupItem {
  value: string;
  label: string;
  metadata: {
    locationId: string;
    locationTypeId: string;
  };
}

export type GetWarehouseLookupResponse = ApiSuccessResponse<
  WarehouseLookupItem[]
>;

export interface GetWarehouseLookupFilters {
  locationTypeId?: string;
  warehouseTypeId?: string;
  includeArchived?: boolean;
}

export type WarehouseLookupState = AsyncState<WarehouseLookupItem[]>;

/**
 * Specialized alias for warehouse lookup options.
 * Reuses the generic LookupOption structure.
 */
export type WarehouseOption = LookupOption;

/**
 * Represents a single option in the lot adjustment lookup.
 */
export interface LotAdjustmentTypeLookupItem {
  /**
   * The unique identifier of the lot adjustment type.
   * Used as the `value` in lookup menus.
   */
  value: string;
  
  /**
   * The display label of the lot adjustment type.
   * Typically shown as the visible text in the lookup option.
   */
  label: string;
  
  /**
   * The unique identifier of the related inventory action type.
   * Used for internal mapping or further logic.
   */
  actionTypeId: string;
}

/**
 * Typed API response for fetching lot adjustment lookup options.
 */
export type LotAdjustmentTypeLookupResponse = ApiSuccessResponse<LotAdjustmentTypeLookupItem[]>;

export type LotAdjustmentTypeLookupState = AsyncState<LotAdjustmentTypeLookupItem[]>;

/**
 * Specialized alias for lot adjustment type lookup options.
 */
export type AdjustmentTypeOption = LookupOption;

export type BatchLookupOption = {
  value: string;
  label: string;
  type: string;
};
