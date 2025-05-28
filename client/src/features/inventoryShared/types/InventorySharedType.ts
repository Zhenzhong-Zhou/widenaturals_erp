import type { PaginationParams } from '@shared-types/api';

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
  expirySeverity: 'expired' | 'expired_soon' | 'critical' | 'warning' | 'notice' | 'safe' | 'normal' | 'unknown';
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
  batchType?: 'product' | 'packaging_material';
  
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
  expiryDate?: string;  // yyyy-mm-dd
  createdAt?: string;   // yyyy-mm-dd
}

export interface BaseInventoryRecord {
  id: string;
  itemType: 'product' | 'packaging_material';
  
  quantity: {
    available: number;
    reserved: number;
  };
  
  lot: {
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
    received_name: string;
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
