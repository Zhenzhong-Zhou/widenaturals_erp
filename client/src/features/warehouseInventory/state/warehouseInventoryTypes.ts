/**
 * @file warehouseInventoryTypes.ts
 *
 * Type definitions for the Warehouse Inventory domain.
 *
 * Covers API response shapes (nested), flattened UI records,
 * filter/query parameters, sort fields, and Redux state types.
 */

import type {
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import { ReduxPaginatedState } from '@shared-types/pagination';

// =============================================================================
// Product Info
// =============================================================================

/** Production batch associated with a product inventory record. */
interface ProductBatch {
  /** Batch UUID. */
  id: string;
  /** Manufacturer-assigned lot number. */
  lotNumber: string;
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
  batchType: string;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseFee: string;
  inboundDate: string;
  outboundDate: string | null;
  lastMovementAt: string | null;
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
  batchType: string;
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseFee: string;
  inboundDate: string;
  outboundDate: string | null;
  lastMovementAt: string | null;
  statusId: string;
  statusName: string;
  statusDate: string;
  
  // Product fields (null when batchType === 'packaging_material')
  productBatchId: string | null;
  lotNumber: string | null;
  skuId: string | null;
  sku: string | null;
  barcode: string | null;
  sizeLabel: string | null;
  countryCode: string | null;
  marketRegion: string | null;
  productId: string | null;
  productName: string | null;
  brand: string | null;
  manufacturerId: string | null;
  manufacturerName: string | null;
  
  // Packaging fields (null when batchType === 'product')
  packagingBatchId: string | null;
  packagingLotNumber: string | null;
  materialId: string | null;
  materialCode: string | null;
  supplierId: string | null;
  supplierName: string | null;
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
  /** Filter by batch type. */
  batchType?: 'product' | 'packaging_material';
  /** Filter by inventory status ID (UUID). */
  statusId?: string;
  /** Filter by SKU ID (UUID). */
  skuId?: string;
  /** Filter by product ID (UUID). */
  productId?: string;
  /** Filter by packaging material ID (UUID). */
  packagingMaterialId?: string;
  /** Show items at or below this quantity threshold. */
  lowStockThreshold?: number;
  /** Show items expiring within this many days. */
  expiringWithinDays?: number;
  /** Filter inbound date on or after (ISO string). */
  inboundDateAfter?: string;
  /** Filter inbound date on or before (ISO string). */
  inboundDateBefore?: string;
  /** Filter to items with reserved quantity. */
  hasReserved?: boolean;
  /** Full-text search across lot number, product name, SKU, material code. */
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
  | 'warehouseQuantity'
  | 'reservedQuantity'
  | 'availableQuantity'
  | 'warehouseFee'
  | 'statusName'
  | 'lotNumber'
  | 'productName'
  | 'sku'
  | 'materialCode'
  | 'defaultNaturalSort';
