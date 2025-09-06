import {
  type AllocationReviewItem, type BatchReview,
  type OrderHeaderReview,
} from '../state';
import { isPackagingBatch, isProductBatch } from '@utils/batchTypeGuards';

export interface FlattenedAllocationOrderHeader {
  orderNumber: string;
  note: string | null;
  createdBy: string;
  orderStatus: string;
  orderStatusCode: string;
  orderStatusId: string;
  salespersonId: string;
  salespersonName: string;
}

export const flattenAllocationOrderHeader = (
  header: OrderHeaderReview
): FlattenedAllocationOrderHeader => ({
  orderNumber: header.orderNumber,
  note: header.note,
  createdBy: header.createdBy,
  orderStatus: header.orderStatus.name,
  orderStatusCode: header.orderStatus.code,
  orderStatusId: header.orderStatus.id,
  salespersonId: header.salesperson.id,
  salespersonName: header.salesperson.fullName,
});

export interface FlattenedAllocationReviewItem {
  allocationId: string;
  allocationStatus: string;
  allocationStatusCode: string;
  allocatedQuantity: number;
  createdAt: string;
  updatedAt: string;
  
  orderItemId: string;
  orderId: string;
  orderItemStatusName: string;
  orderItemStatusDate: string;
  quantityOrdered: number;
  
  skuCode: string | null;
  barcode: string | null;
  productName: string | null;
  
  packagingMaterialCode: string | null;
  packagingMaterialLabel: string | null;
  
  batchLotNumber: string | null;
  batchExpiryDate: string | null;
  manufactureDate: string | null;
  batchType: 'product' | 'packaging_material' | 'unknown';
  
  createdByName: string;
  updatedByName: string;
  
  warehouseInventoryList: {
    id: string;
    warehouseQuantity: number;
    reservedQuantity: number;
    statusName: string;
    statusDate: string;
    warehouseName: string;
    inboundDate: string;
  }[];
}

export const parseBatch = (
  batch: BatchReview | null | undefined
): {
  batchLotNumber: string | null;
  batchExpiryDate: string | null;
  manufactureDate: string | null;
  batchType: 'product' | 'packaging_material' | 'unknown';
} => {
  if (!batch) {
    return {
      batchLotNumber: null,
      batchExpiryDate: null,
      manufactureDate: null,
      batchType: 'unknown',
    };
  }
  
  if (isProductBatch(batch)) {
    return {
      batchLotNumber: batch.lotNumber ?? null,
      batchExpiryDate: batch.expiryDate ?? null,
      manufactureDate: batch.manufactureDate ?? null,
      batchType: batch.type,
    };
  }
  
  if (isPackagingBatch(batch)) {
    return {
      batchLotNumber: batch.lotNumber ?? null,
      batchExpiryDate: batch.expiryDate ?? null,
      manufactureDate: batch.manufactureDate ?? null,
      batchType: batch.type,
    };
  }
  
  return {
    batchLotNumber: null,
    batchExpiryDate: null,
    manufactureDate: null,
    batchType: 'unknown',
  };
};

export const flattenInventoryAllocationReviewItems = (
  items: AllocationReviewItem[]
): FlattenedAllocationReviewItem[] => {
  return items.map((item) => {
    const {
      allocationId,
      allocationStatusName,
      allocationStatusCode,
      allocatedQuantity,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      product,
      packagingMaterial,
      orderItem,
      batch,
      warehouseInventoryList,
    } = item;
    
    const {
      batchLotNumber,
      batchExpiryDate,
      manufactureDate,
      batchType,
    } = parseBatch(batch);
    
    return {
      allocationId,
      allocationStatus: allocationStatusName ?? '—',
      allocationStatusCode: allocationStatusCode ?? '',
      allocatedQuantity: allocatedQuantity ?? 0,
      createdAt: createdAt ?? '',
      updatedAt: updatedAt ?? createdAt ?? '',
      
      orderItemId: orderItem?.id ?? '—',
      orderId: orderItem?.orderId ?? '—',
      orderItemStatusName: orderItem?.statusName ?? '—',
      orderItemStatusDate: orderItem?.statusDate ?? '',
      quantityOrdered: orderItem?.quantityOrdered ?? 0,
      
      skuCode: product?.skuCode ?? null,
      barcode: product?.barcode ?? null,
      productName: product?.displayName ?? null,
      
      packagingMaterialCode: packagingMaterial?.code ?? null,
      packagingMaterialLabel: packagingMaterial?.label ?? null,
      
      batchLotNumber,
      batchExpiryDate,
      manufactureDate,
      batchType,
      
      createdByName: createdBy?.fullName ?? '—',
      updatedByName: updatedBy?.fullName ?? '—',
      
      warehouseInventoryList: Array.isArray(warehouseInventoryList)
        ? warehouseInventoryList.map((wi) => ({
          id: wi.id,
          warehouseQuantity: wi.warehouseQuantity ?? 0,
          reservedQuantity: wi.reservedQuantity ?? 0,
          statusName: wi.statusName ?? '—',
          statusDate: wi.statusDate ?? '',
          inboundDate: wi.inboundDate ?? '',
          warehouseName: wi.warehouseName ?? '—',
        }))
        : [],
    };
  });
};
