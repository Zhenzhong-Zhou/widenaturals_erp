import type { ReactNode } from 'react';
import type { ApiSuccessResponse, PaginationParams } from '@shared-types/api';
import type { WarehouseInventoryRecord } from '@features/warehouseInventory/state';
import type { LocationInventoryRecord } from '@features/locationInventory/state';

export interface InventoryHealthStatus {
  reservedQuantity: number;
  availableQuantity: number;
  totalLotQuantity: number;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
  displayStatus: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  isLowStock: boolean;
  stockLevel: 'none' | 'critical' | 'low_stock' | 'normal';
  expirySeverity:
    | 'expired'
    | 'expired_soon'
    | 'critical'
    | 'warning'
    | 'notice'
    | 'safe'
    | 'normal'
    | 'unknown';
}

export type ItemType = 'product' | 'packaging_material' | undefined;

/**
 * Interface for fetching inventory summary details by item ID with pagination.
 *
 * Can be used for both warehouse and location inventory queries depending on the context.
 */
export interface InventorySummaryDetailByItemIdParams extends PaginationParams {
  /**
   * The ID of the SKU or material to query inventory for.
   */
  itemId: string;
}

export interface BaseInventorySummaryItem {
  lotNumber: string;
  item: {
    id: string;
    code: string;
  };
  manufactureDate: string;
  expiryDate: string;
  quantity: {
    reserved: number;
    available: number;
  };
  status: {
    id: string;
    name: string;
    date: string;
  };
  timestamps: {
    inboundDate?: string;
    outboundDate?: string;
    lastUpdate: string;
  };
  durationInStorage: number | string;
}

export interface BaseFlatInventoryRow {
  itemCode: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  reserved: number;
  available: number;
  statusName: string;
  statusDate: string;
  inboundDate?: string;
  outboundDate?: string;
  lastUpdate: string;
  durationInStorage: number | string;
}

export interface BaseInventoryFilters {
  batchType?: ItemType;

  // Product-related
  productName?: string;
  sku?: string;

  // Material-related
  materialName?: string;
  materialCode?: string;

  // Part-related
  partName?: string;
  partCode?: string;
  partType?: string;

  // Common
  lotNumber?: string;
  status?: string;
  inboundDate?: string; // yyyy-mm-dd
  expiryDate?: string; // yyyy-mm-dd
  createdAt?: string; // yyyy-mm-dd
}

export interface BaseInventoryRecord {
  id: string;
  itemType: ItemType;

  quantity: {
    available: number;
    reserved: number;
  };

  lot: {
    batchId: string;
    number: string;
    manufactureDate: string | null;
    expiryDate: string | null;
  };

  product?: {
    name: string;
    brand?: string;
    sku?: string;
    barcode?: string;
    countryCode?: string;
    language?: string;
    sizeLabel?: string;
    manufacturer?: string;
  };

  material?: {
    name: string;
    receivedName: string;
    code: string;
    color?: string | null;
    size?: string | null;
    unit: string;
    supplier?: string;
  };

  part?: {
    name: string;
    code: string;
    type: string;
    unit: string;
  };

  createdBy: string | null;
  updatedBy?: string | null;

  status: {
    name: string;
    stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
    expirySeverity: 'normal' | 'expired' | 'expired_soon' | string;
  };

  display: {
    name: string;
  };

  timestamps: {
    createdAt: string;
    updatedAt: string | null;
    inboundDate: string;
    outboundDate: string | null;
    lastUpdate: string;
    statusDate: string;
  };
}

export interface FlatInventoryRowBase<T> {
  id: string;
  lotNumber: string;
  name: string;
  locationQuantity: number;
  available: number;
  reserved: number;
  status: string;
  statusDate: string;
  stockLevel: string;
  expirySeverity: string;
  expiryDate: string;
  lastUpdate: string;
  isGroupHeader?: boolean;
  originalRecord: T;
}

export interface BaseInventoryTableProps<T, FlatT> {
  isLoading: boolean;
  groupedData: Record<string, T[]>;
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandedRowId?: string | null;
  onExpandToggle?: (row: FlatT) => void;
  isRowExpanded?: (row: FlatT) => boolean;
  expandedContent?: (row: FlatT) => ReactNode;
}

export interface InventoryRecordInput {
  warehouse_id: string;
  location_id: string;
  batch_id: string;
  batch_type: ItemType; // or string if more types are possible
  quantity: number;
  inbound_date: string; // ISO date string (e.g., "2025-05-28")
  comments?: string;
}

export interface CreateInventoryRecordsRequest {
  records: InventoryRecordInput[];
}

export interface InventoryRecordOutput {
  id: string;
  quantity: number;
  reserved: number;
  batchType: ItemType; // or string
  lotNumber: string;
  expiryDate: string; // ISO timestamp string (e.g., "2026-02-13T08:00:00.000Z")
  name: string;
  itemType: ItemType; // or string
}

export interface InventoryAdjustmentInput {
  warehouse_id: string;
  location_id: string;
  batch_id: string;
  batch_type: ItemType;
  quantity: number;
  inventory_action_type_id: string;
  adjustment_type_id: string;
  comments?: string;
}

export interface AdjustInventoryRequestBody {
  updates: InventoryAdjustmentInput[];
}

export interface InventoryAdjustmentFormData {
  newQuantity: string;
  adjustment_type_id: string;
  note?: string;
}

export interface InventoryRecordsPayload {
  warehouse: InventoryRecordOutput[];
  location: InventoryRecordOutput[];
}

export type InventoryRecordsResponse =
  ApiSuccessResponse<InventoryRecordsPayload>;

export interface AdjustedInventoryData {
  id: string;
  warehouseId: string;
  locationId: string;
  batchId: string;
  batchType: 'product' | 'packaging_material';
  warehouseName?: string;
  locationName?: string;
  displayName: string;
  lotNumber: string;
  expiryDate: string;
  warehouseQuantity?: number;
  locationQuantity?: number;
  status: string;
}

export type InventoryRecord = WarehouseInventoryRecord | LocationInventoryRecord;
