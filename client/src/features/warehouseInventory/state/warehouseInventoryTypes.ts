/**
 * @file warehouseInventoryTypes.ts
 *
 * Type definitions for the Warehouse Inventory domain.
 *
 * Covers API response shapes (nested), flattened UI records,
 * filter/query parameters, sort fields, and Redux state types.
 */

import type {
  ApiSuccessResponse,
  GenericAudit,
  GenericStatus,
  MutationState,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import type { BatchEntityType } from '@shared-types/batch';
import type { NullableNumber, NullableString } from '@shared-types/shared';

// =============================================================================
// Product Info
// =============================================================================

/** Production batch associated with a product inventory record. */
interface ProductBatch {
  /** Batch UUID. */
  id: string;
  /** Manufacturer-assigned lot number. */
  lotNumber: string;
  /** Product expiry date (ISO 8601). Required for all product batches. */
  expiryDate: string;
}

/** SKU details for a product inventory record. */
interface ProductSku {
  /** SKU UUID. */
  id: string;
  /** SKU code (e.g. "WN-MO409-L-UN"). */
  sku: string;
  /** UPC / EAN barcode. */
  barcode: string;
  /** Human-readable size (e.g. "60 Softgels"). */
  sizeLabel: string;
  /** ISO country code the SKU targets. */
  countryCode: string;
  /** Market region label (e.g. "Universe"). */
  marketRegion: string;
}

/** Core product identity for a product inventory record. */
interface Product {
  /** Product UUID. */
  id: string;
  /** Product display name. */
  name: string;
  /** Brand name (e.g. "WIDE Naturals"). */
  brand: string;
  
  displayName: string;
}

/** Manufacturer linked to a product batch. */
interface ProductManufacturer {
  /** Manufacturer UUID. */
  id: string;
  /** Manufacturer display name. */
  name: string;
}

/** Nested product details present when `batchType === 'product'`. */
interface ProductInfo {
  /** Production batch. */
  batch: ProductBatch;
  /** SKU the batch was produced under. */
  sku: ProductSku;
  /** Parent product. */
  product: Product;
  /** Manufacturer of the batch. */
  manufacturer: ProductManufacturer;
}

// =============================================================================
// Packaging Info
// =============================================================================

/** Packaging batch associated with a packaging material inventory record. */
interface PackagingBatch {
  /** Batch UUID. */
  id: string;
  /** Supplier-assigned lot number. */
  lotNumber: string;
  /** Packaging material expiry date (ISO 8601). Optional — not all materials have one. */
  expiryDate?: string;
}

/** Packaging material details. */
interface PackagingMaterial {
  /** Material UUID. */
  id: string;
  /** Internal material code (e.g. "MAT-2PB005"). */
  code: string;
}

/** Supplier linked to a packaging batch. */
interface PackagingSupplier {
  /** Supplier UUID. */
  id: string;
  /** Supplier display name. */
  name: string;
}

/** Nested packaging details present when `batchType === 'packaging_material'`. */
interface PackagingInfo {
  /** Packaging batch. */
  batch: PackagingBatch;
  /** Packaging material. */
  material: PackagingMaterial;
  /** Material supplier. */
  supplier: PackagingSupplier;
}

// =============================================================================
// API Response Types
// =============================================================================

/** Single warehouse inventory record as returned by the API (nested shape). */
export interface WarehouseInventoryRecord {
  id: string;
  batchId: string;
  batchType: BatchEntityType;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseFee: string;
  inboundDate: string;
  outboundDate: NullableString;
  lastMovementAt: NullableString;
  status: GenericStatus;
  productInfo: ProductInfo | null;
  packagingInfo: PackagingInfo | null;
}

/** Paginated API response for warehouse inventory. */
export type PaginatedWarehouseInventoryApiResponse =
  PaginatedResponse<WarehouseInventoryRecord>;

// =============================================================================
// Flattened / UI Types
// =============================================================================

/** Flattened warehouse inventory record for table views. */
export type FlattenedWarehouseInventory = {
  id: string;
  batchId: string;
  batchType: BatchEntityType;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseFee: string;
  inboundDate: string;
  outboundDate: NullableString;
  lastMovementAt: NullableString;
  statusId: string;
  statusName: string;
  statusDate: string;
  
  // Product fields (null when batchType === 'packaging_material')
  productBatchId: NullableString;
  productLotNumber: NullableString;
  productExpiryDate: NullableString;
  skuId: NullableString;
  sku: NullableString;
  barcode: NullableString;
  sizeLabel: NullableString;
  countryCode: NullableString;
  marketRegion: NullableString;
  productId: NullableString;
  productName: NullableString;
  brand: NullableString;
  displayName: NullableString;
  manufacturerId: NullableString;
  manufacturerName: NullableString;
  
  // Packaging fields (null when batchType === 'product')
  packagingBatchId: NullableString;
  packagingLotNumber: NullableString;
  packagingExpiryDate: NullableString;
  materialId: NullableString;
  materialCode: NullableString;
  supplierId: NullableString;
  supplierName: NullableString;
};

/** Paginated UI response for the warehouse inventory list page. */
export type PaginatedWarehouseInventoryListUiResponse =
  PaginatedResponse<FlattenedWarehouseInventory>;

/** Redux state shape for the warehouse inventory list slice. */
export type WarehouseInventoryListState =
  ReduxPaginatedState<FlattenedWarehouseInventory>;

// =============================================================================
// Filters & Query Params
// =============================================================================

/** Filters available for querying the warehouse inventory list. */
export type WarehouseInventoryFilters = {
  /** Filter by batch type (product or packaging material). */
  batchType?: BatchEntityType;
  
  /** Filter by one or more inventory status IDs (UUID). */
  statusIds?: string[];
  
  /** Filter by one or more SKU IDs (UUID). */
  skuIds?: string[];
  
  /** Filter by one or more product IDs (UUID). */
  productIds?: string[];
  
  /** Filter by one or more packaging material IDs (UUID). */
  packagingMaterialIds?: string[];
  
  /** Show items at or below this on-hand quantity threshold. */
  lowStockThreshold?: number;
  
  /** Show items expiring within this many days from today. */
  expiringWithinDays?: number;
  
  /** Filter inbound date on or after this ISO 8601 date (YYYY-MM-DD). */
  inboundDateAfter?: string;
  
  /** Filter inbound date on or before this ISO 8601 date (YYYY-MM-DD). */
  inboundDateBefore?: string;
  
  /** When true, show only items with a non-zero reserved quantity. */
  hasReserved?: boolean;
  
  /** Full-text search across lot number, product name, SKU, and material code. */
  search?: string;
};

/** Full query parameter shape for the warehouse inventory list endpoint. */
export interface WarehouseInventoryQueryParams extends PaginationParams, SortConfig {
  /** Warehouse UUID — path parameter, included here for thunk convenience. */
  warehouseId: string;
  filters?: WarehouseInventoryFilters;
}

// =============================================================================
// Sort Fields
// =============================================================================

/** Valid sort field keys for the warehouse inventory list. */
export type WarehouseInventorySortField =
  | 'inboundDate'
  | 'outboundDate'
  | 'lastMovementAt'
  | 'statusDate'
  | 'warehouseQuantity'
  | 'reservedQuantity'
  | 'availableQuantity'
  | 'warehouseFee'
  | 'statusName'
  | 'batchType'
  | 'productName'
  | 'sku'
  | 'defaultNaturalSort';

// =============================================================================
// Create Warehouse Inventory Types
// =============================================================================

/** Single inventory record for creation. */
export type CreateWarehouseInventoryRecord = {
  /** Batch registry UUID (product or packaging batch). */
  batchId: string;
  /** Quantity to inbound. */
  warehouseQuantity: number;
  /** Optional storage fee per unit (decimal string). */
  warehouseFee?: number;
  /** Optional inbound date (ISO string). Defaults to now on the server. */
  inboundDate?: string;
  /** Optional inventory status UUID. Defaults to server-side default. */
  statusId?: string;
};

/** Request payload for creating warehouse inventory records. */
export type CreateWarehouseInventoryRequest = {
  records: CreateWarehouseInventoryRecord[];
};

/** Data returned after creating warehouse inventory records. */
export type CreateWarehouseInventoryData = {
  count: number;
  ids: string[];
};

/** API response after creating warehouse inventory records. */
export type CreateWarehouseInventoryResponse =
  ApiSuccessResponse<CreateWarehouseInventoryData>;

/** Redux mutation state for warehouse inventory creation. */
export type WarehouseInventoryCreateState =
  MutationState<CreateWarehouseInventoryData>;

// =============================================================================
// Adjust Quantities Warehouse Inventory Types
// =============================================================================

/** Single quantity adjustment item. */
export type AdjustWarehouseInventoryQuantityItem = {
  /** Inventory record UUID. */
  id: string;
  /** Updated warehouse quantity. */
  warehouseQuantity: number;
  /** Updated reserved quantity. Requires FORCE_ADJUST_RESERVED permission. */
  reservedQuantity?: number;
};

/** Request payload for bulk quantity adjustments. */
export type AdjustWarehouseInventoryQuantityRequest = {
  updates: AdjustWarehouseInventoryQuantityItem[];
};

/** Data returned after adjusting warehouse inventory quantities. */
export type AdjustWarehouseInventoryQuantityData = {
  count: number;
  updatedIds: string[];
};

/** API response after adjusting warehouse inventory quantities. */
export type AdjustWarehouseInventoryQuantityResponse =
  ApiSuccessResponse<AdjustWarehouseInventoryQuantityData>;

/** Redux mutation state for warehouse inventory quantity adjustments. */
export type WarehouseInventoryAdjustQuantityState =
  MutationState<AdjustWarehouseInventoryQuantityData>;

// =============================================================================
// Update Statuses Warehouse Inventory Types
// =============================================================================

/** Single status update item. */
export type UpdateWarehouseInventoryStatusItem = {
  /** Inventory record UUID. */
  id: string;
  /** New inventory status UUID. */
  statusId: string;
};

/** Request payload for bulk status updates. */
export type UpdateWarehouseInventoryStatusRequest = {
  updates: UpdateWarehouseInventoryStatusItem[];
};

/** Data returned after updating warehouse inventory statuses. */
export type UpdateWarehouseInventoryStatusData = {
  count: number;
  updatedIds: string[];
};

/** API response after updating warehouse inventory statuses. */
export type UpdateWarehouseInventoryStatusResponse =
  ApiSuccessResponse<UpdateWarehouseInventoryStatusData>;

/** Redux mutation state for warehouse inventory status updates. */
export type WarehouseInventoryUpdateStatusState =
  MutationState<UpdateWarehouseInventoryStatusData>;

// =============================================================================
// Update Metadata Warehouse Inventory Types
// =============================================================================

/** Request payload for updating a single inventory record's metadata. */
export type UpdateWarehouseInventoryMetadataRequest = {
  /** Updated inbound date (ISO string). */
  inboundDate?: string;
  /** Updated warehouse fee (decimal). */
  warehouseFee?: number;
};

/** Data returned after updating a single inventory record's metadata. */
export type UpdateWarehouseInventoryMetadataData = {
  id: string;
  inboundDate: string;
  warehouseFee: string;
  updatedAt: string;
};

/** API response after updating warehouse inventory metadata. */
export type UpdateWarehouseInventoryMetadataResponse =
  ApiSuccessResponse<UpdateWarehouseInventoryMetadataData>;

/** Redux mutation state for warehouse inventory metadata update. */
export type WarehouseInventoryUpdateMetadataState =
  MutationState<UpdateWarehouseInventoryMetadataData>;

// =============================================================================
// Outbound Warehouse Inventory Types
// =============================================================================

/** Single outbound record item. */
export type RecordWarehouseInventoryOutboundItem = {
  /** Inventory record UUID. */
  id: string;
  /** Outbound date (ISO string). */
  outboundDate: string;
  /** Remaining warehouse quantity after outbound. */
  warehouseQuantity: number;
};

/** Request payload for bulk outbound recording. */
export type RecordWarehouseInventoryOutboundRequest = {
  updates: RecordWarehouseInventoryOutboundItem[];
};

/** Data returned after recording warehouse inventory outbound. */
export type RecordWarehouseInventoryOutboundData = {
  count: number;
  updatedIds: string[];
};

/** API response after recording warehouse inventory outbound. */
export type RecordWarehouseInventoryOutboundResponse =
  ApiSuccessResponse<RecordWarehouseInventoryOutboundData>;

/** Redux mutation state for warehouse inventory outbound recording. */
export type WarehouseInventoryOutboundState =
  MutationState<RecordWarehouseInventoryOutboundData>;

// =============================================================================
// Warehouse Inventory Detail — Nested Sub-Types
// =============================================================================

/** Product batch details for detail view (extended from list shape). */
interface ProductBatchDetail {
  id: string;
  lotNumber: string;
  expiryDate: NullableString;
  manufactureDate: NullableString;
  initialQuantity: NullableNumber;
  notes: NullableString;
}

/** SKU details for detail view. */
interface ProductSkuDetail {
  id: string;
  sku: string;
  barcode: string;
  sizeLabel: string;
  countryCode: string;
  marketRegion: string;
}

/** Product details for detail view (extended from list shape). */
interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  category: NullableString;
  series: NullableString;
  displayName: string;
}

/** Manufacturer details for detail view. */
interface ProductManufacturerDetail {
  id: string;
  name: string;
}

/** Nested product info for detail view. */
interface ProductInfoDetail {
  batch: ProductBatchDetail;
  sku: ProductSkuDetail;
  product: ProductDetail;
  manufacturer: ProductManufacturerDetail;
}

/** Packaging batch details for detail view (extended from list shape). */
interface PackagingBatchDetail {
  id: string;
  lotNumber: string;
  displayName: NullableString;
  expiryDate: NullableString;
  initialQuantity: NullableNumber;
  unit: NullableString;
}

/** Packaging material details for detail view (extended from list shape). */
interface PackagingMaterialDetail {
  id: string;
  code: string;
  name: NullableString;
  category: NullableString;
}

/** Packaging supplier details for detail view. */
interface PackagingSupplierDetail {
  id: string;
  name: string;
}

/** Nested packaging info for detail view. */
interface PackagingInfoDetail {
  batch: PackagingBatchDetail;
  material: PackagingMaterialDetail;
  supplier: PackagingSupplierDetail;
}

// =============================================================================
// Warehouse Zone & Movement
// =============================================================================

/** Zone allocation for an inventory record. */
export type WarehouseZone = {
  id: string;
  zoneCode: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  zoneEntryDate: NullableString;
  zoneExitDate: NullableString;
};

/** Movement history entry for an inventory record. */
export type WarehouseMovement = {
  id: string;
  movementType: string;
  fromZoneCode: NullableString;
  toZoneCode: NullableString;
  quantity: number;
  referenceType: NullableString;
  referenceId: NullableString;
  notes: NullableString;
  performedBy: NullableString;
  performedAt: NullableString;
  performedByName: NullableString;
};

// =============================================================================
// Detail Record
// =============================================================================

/** Full warehouse inventory detail record as returned by the API. */
export type WarehouseInventoryDetailRecord = {
  id: string;
  batchId: string;
  batchType: BatchEntityType;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseFee: string;
  inboundDate: string;
  outboundDate: NullableString;
  lastMovementAt: NullableString;
  registeredAt: NullableString;
  batchNote: NullableString;
  status: GenericStatus;
  productInfo: ProductInfoDetail | null;
  packagingInfo: PackagingInfoDetail | null;
  audit: GenericAudit | null;
  zones: WarehouseZone[];
  movements: WarehouseMovement[];
};

// =============================================================================
// API Response & Redux State
// =============================================================================

/** API response for a single warehouse inventory detail. */
export type WarehouseInventoryDetailResponse =
  ApiSuccessResponse<WarehouseInventoryDetailRecord>;

/** Redux state shape for warehouse inventory detail view. */
export type WarehouseInventoryDetailState = {
  data: WarehouseInventoryDetailRecord | null;
  loading: boolean;
  error: UiErrorPayload | null;
};

// =============================================================================
// Activity Log Record
// =============================================================================

/** Single inventory activity log record as returned by the API. */
export type InventoryActivityLogRecord = {
  id: string;
  warehouseInventoryId: string;
  batchType: BatchEntityType;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  actionTypeName: string;
  actionTypeCategory: string;
  adjustmentTypeName: NullableString;
  status: GenericStatus;
  referenceType: NullableString;
  referenceId: NullableString;
  comments: NullableString;
  metadata: Record<string, unknown> | null;
  performedAt: string;
  performedByName: NullableString;
  
  // Product context (null when batchType === 'packaging_material')
  productLotNumber: NullableString;
  productName: NullableString;
  sku: NullableString;
  
  // Packaging context (null when batchType === 'product')
  packagingLotNumber: NullableString;
  packagingDisplayName: NullableString;
  packagingMaterialCode: NullableString;
};

// =============================================================================
// Filters & Query Params
// =============================================================================

/** Filters available for querying the inventory activity log. */
export type InventoryActivityLogFilters = {
  /** Filter by inventory record UUID. */
  inventoryId?: string;
  /** Filter by action type UUID. */
  actionTypeId?: string;
  /** Filter by adjustment type UUID. */
  adjustmentTypeId?: string;
  /** Filter by reference type. */
  referenceType?: 'order' | 'transfer' | 'audit' | 'return' | 'manual';
  /** Filter by user who performed the action (UUID). */
  performedBy?: string;
  /** Filter performed at on or after (ISO string). */
  performedAtAfter?: string;
  /** Filter performed at on or before (ISO string). */
  performedAtBefore?: string;
};

/** Full query parameter shape for the activity log endpoint. */
export interface InventoryActivityLogQueryParams extends PaginationParams, SortConfig {
  /** Warehouse UUID — path parameter, included here for thunk convenience. */
  warehouseId: string;
  filters?: InventoryActivityLogFilters;
}

// =============================================================================
// Sort Fields
// =============================================================================

/** Valid sort field keys for the inventory activity log. */
export type InventoryActivityLogSortField =
  | 'performedAt'
  | 'actionTypeName'
  | 'quantityChange'
  | 'newQuantity'
  | 'referenceType'
  | 'defaultNaturalSort';

// =============================================================================
// API Response & Redux State
// =============================================================================

/** Paginated API response for inventory activity logs. */
export type PaginatedInventoryActivityLogApiResponse =
  PaginatedResponse<InventoryActivityLogRecord>;

/** Paginated UI response for the activity log list page. */
export type PaginatedInventoryActivityLogListUiResponse =
  PaginatedResponse<InventoryActivityLogRecord>;

/** Redux state shape for the inventory activity log list slice. */
export type InventoryActivityLogListState =
  ReduxPaginatedState<InventoryActivityLogRecord>;

// =============================================================================
// Warehouse Summary
// =============================================================================

/** Warehouse identity within a summary response. */
export type WarehouseSummaryInfo = {
  id: string;
  name: string;
  code: string;
  storageCapacity: NullableNumber;
  defaultFee: NullableString;
  typeName: NullableString;
};

/** Aggregate totals across all inventory in a warehouse. */
export type WarehouseSummaryTotals = {
  batches: number;
  productSkus: number;
  packagingMaterials: number;
  quantity: number;
  reserved: number;
  available: number;
};

/** Batch type breakdown within a warehouse summary. */
export type WarehouseSummaryBatchType = {
  batchCount: number;
  quantity: number;
};

/** Inventory breakdown by status. */
export type WarehouseSummaryByStatus = {
  statusId: string;
  statusName: string;
  batchCount: number;
  quantity: number;
  reserved: number;
  available: number;
};

/** Full warehouse summary record as returned by the API. */
export type WarehouseSummaryRecord = {
  warehouse: WarehouseSummaryInfo;
  totals: WarehouseSummaryTotals;
  byBatchType: {
    product: WarehouseSummaryBatchType;
    packagingMaterial: WarehouseSummaryBatchType;
  };
  byStatus: WarehouseSummaryByStatus[];
};

/** API response for warehouse summary. */
export type WarehouseSummaryResponse =
  ApiSuccessResponse<WarehouseSummaryRecord>;

/** Redux state shape for warehouse summary. */
export type WarehouseSummaryState = {
  data: WarehouseSummaryRecord | null;
  loading: boolean;
  error: UiErrorPayload | null;
};

// =============================================================================
// Warehouse Item Summary
// =============================================================================

/** SKU-level summary within a product group. */
export type WarehouseProductSkuSummary = {
  skuId: string;
  sku: string;
  sizeLabel: string;
  countryCode: string;
  marketRegion: string;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  batchCount: number;
  earliestExpiry: NullableString;
};

/** Product-level summary with nested SKU breakdown. */
export type WarehouseProductSummary = {
  productId: string;
  productName: string;
  brand: string;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  batchCount: number;
  earliestExpiry: NullableString;
  skus: WarehouseProductSkuSummary[];
};

/** Packaging material summary. */
export type WarehousePackagingSummary = {
  packagingMaterialId: string;
  packagingMaterialCode: string;
  packagingMaterialName: string;
  packagingMaterialCategory: NullableString;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  batchCount: number;
  earliestExpiry: NullableString;
};

/** Combined item summary record as returned by the API. */
export type WarehouseItemSummaryRecord = {
  products: WarehouseProductSummary[];
  packagingMaterials: WarehousePackagingSummary[];
};

/** Optional batch type filter for item summary. */
export type WarehouseItemSummaryFilters = {
  batchType?: BatchEntityType;
};

/** Query params for the item summary endpoint. */
export interface WarehouseItemSummaryQueryParams {
  warehouseId: string;
  filters?: WarehouseItemSummaryFilters;
}

/** API response for warehouse item summary. */
export type WarehouseItemSummaryResponse =
  ApiSuccessResponse<WarehouseItemSummaryRecord>;

/** Redux state shape for warehouse item summary. */
export type WarehouseItemSummaryState = {
  data: WarehouseItemSummaryRecord | null;
  loading: boolean;
  error: UiErrorPayload | null;
};
