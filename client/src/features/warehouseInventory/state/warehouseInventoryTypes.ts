import type {
  PaginatedResponse,
  ReduxPaginatedState,
  PaginationParams,
  SortConfig, MutationState,
} from '@shared-types/api';
import type {
  BaseFlatInventoryRow,
  BaseInventoryFilters,
  BaseInventoryRecord,
  BaseInventorySummaryItem,
  BaseInventoryTableProps,
  FlatInventoryRowBase,
  InventoryHealthStatus,
  ItemType, InventoryRecordsResponse,
} from '@features/inventoryShared/types/InventorySharedType';

export interface FetchWarehouseInventoryItemSummaryParams {
  page?: number;
  limit?: number;
  itemType?: ItemType;
}

export interface BaseWarehouseInventoryItemSummary
  extends InventoryHealthStatus {
  itemId: string;
  itemType: ItemType;
  itemName: string;

  totalInventoryEntries: number;
  actualQuantity: number;
  totalLots: number;
  lotQuantity: number;
  status: string;
}

// Product-specific
export interface ProductWarehouseInventorySummary
  extends BaseWarehouseInventoryItemSummary {
  itemType: 'product';
  skuId: string;
  sku: string;
  brand: string;
  productName: string;
}

// Material-specific
export interface MaterialWarehouseInventorySummary
  extends BaseWarehouseInventoryItemSummary {
  itemType: 'packaging_material';
  materialId: string;
  materialCode: string;
  materialName: string;
}

// Union type
export type WarehouseInventoryItemSummary =
  | ProductWarehouseInventorySummary
  | MaterialWarehouseInventorySummary;

export interface WarehouseInventorySummaryItemDetails
  extends BaseInventorySummaryItem {
  warehouseInventoryId: string;
  quantity: BaseInventorySummaryItem['quantity'] & {
    warehouseQuantity: number;
  };
  warehouse: {
    id: string;
    name: string;
  };
}

export type WarehouseInventorySummaryDetailsByItemIdResponse =
  PaginatedResponse<WarehouseInventorySummaryItemDetails>;

export type WarehouseInventorySummaryDetailState =
  ReduxPaginatedState<WarehouseInventorySummaryItemDetails>;

export interface FlatWarehouseInventorySummaryDetailRow
  extends BaseFlatInventoryRow {
  warehouseInventoryId: string;
  warehouseName: string;
  warehouseQuantity: number;
}

export interface WarehouseInventoryFilters extends BaseInventoryFilters {
  warehouseName?: string;
}

export interface WarehouseInventoryRecord extends BaseInventoryRecord {
  warehouse: {
    id: string;
    name: string;
  };
  
  location: {
    id: string;
  };

  quantity: BaseInventoryRecord['quantity'] & {
    warehouseQuantity: number;
  };
}

export type WarehouseInventoryRecordsResponse =
  PaginatedResponse<WarehouseInventoryRecord>;

export interface FetchWarehouseInventoryArgs {
  pagination: PaginationParams;
  filters: WarehouseInventoryFilters;
  sortConfig?: SortConfig;
}

export type WarehouseInventoryState =
  ReduxPaginatedState<WarehouseInventoryRecord>;

export interface FlatWarehouseInventoryRow
  extends FlatInventoryRowBase<WarehouseInventoryRecord> {}

export type WarehouseInventoryTableProps = BaseInventoryTableProps<
  WarehouseInventoryRecord,
  FlatWarehouseInventoryRow
>;

/**
 * Redux state for tracking the createWarehouseInventory mutation.
 * Includes status and response data for inserted inventory records.
 */
export type CreateWarehouseInventoryState = MutationState<InventoryRecordsResponse>;
