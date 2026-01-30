/**
 * Central export barrel for all application hooks.
 *
 * Design principles:
 * - Hooks are grouped by domain for discoverability.
 * - Naming reflects domain intent, not implementation detail.
 * - This file is the ONLY place components should import hooks from.
 * - No circular dependencies (hooks depend on state, never reducers).
 */

/* =====================================================
 * App Initialization & Global Utilities
 * ===================================================== */

export { default as useSystemHealth } from './useSystemHealth';
export { default as useErrorHandler } from './useErrorHandler';
export { default as useThemeMode } from './useThemeMode';

/* =====================================================
 * Auth, Session & Permissions
 * ===================================================== */

export { default as useLogin } from './useLogin';
export { default as useLogout } from './useLogout';
export { default as useUserSelfProfile } from './useUserSelfProfile';
export { default as useUserSelfProfileAuto } from './useUserSelfProfileAuto';
export { default as useUserViewedProfile } from './useUserViewedProfile';
export { default as useUserViewedProfileAuto } from './useUserViewedProfileAuto';
export { default as usePermissions } from './usePermissions';
export { default as usePaginatedUsers } from './usePaginatedUsers';

/* =====================================================
 * Users
 * ===================================================== */

export { default as useCreateUser } from './useCreateUser';

/* =====================================================
 * Product & SKU
 * ===================================================== */

export { default as usePaginatedProducts } from './usePaginatedProducts';
export { default as useCreateProducts } from './useCreateProducts';
export { default as useProductDetail } from './useProductDetail';
export { default as useProductInfoUpdate } from './useProductInfoUpdate';
export { default as useProductStatusUpdate } from './useProductStatusUpdate';

export { default as usePaginatedSkus } from './usePaginatedSkus';
export { default as useCreateSkus } from './useCreateSkus';
export { default as useSkuDetail } from './useSkuDetail';
export { default as useSkuStatus } from './useSkuStatus';
export { default as useSkuProductCards } from './useSkuProductCards';
export { default as useSkuLookup } from './useSkuLookup';
export { default as useSkuCodeBaseLookup } from './useSkuCodeBaseLookup';
export { default as useSkuImageUpload } from './useSkuImageUpload';

/* =====================================================
 * Compliance
 * ===================================================== */

export { default as usePaginatedComplianceRecords } from './usePaginatedComplianceRecords';


/* =====================================================
 * Batch
 * ===================================================== */

export { default as usePaginatedBatchRegistry } from './usePaginatedBatchRegistry';

/* =====================================================
 * BOM (Bill of Materials)
 * ===================================================== */

export { default as usePaginatedBoms } from './usePaginatedBoms';
export { default as useBomDetails } from './useBomDetails';
export { default as useBomMaterialSupplyDetails } from './useBomMaterialSupplyDetails';
export { default as useBomProductionReadiness } from './useBomProductionReadiness';

/* =====================================================
 * Pricing
 * ===================================================== */

export { default as usePricingList } from './usePricingList';
export { default as usePricingListByType } from './usePricingListByType';
export { default as usePricingTypes } from './usePricingTypes';
export { default as usePricingTypeMetadata } from './usePricingTypeMetadata';
export { default as usePricingLookup } from './usePricingLookup';

/* =====================================================
 * Customer & Address
 * ===================================================== */

export { default as useCustomerCreate } from './useCustomerCreate';
export { default as usePaginatedCustomers } from './usePaginatedCustomers';
export { default as useCustomerLookup } from './useCustomerLookup';
export { default as useCustomerAddressesLookup } from './useCustomerAddressesLookup';

export { default as useAddressCreation } from './useAddressCreation';
export { default as usePaginateAddresses } from './usePaginateAddresses';

/* =====================================================
 * Orders Types
 * ===================================================== */

export { default as usePaginateOrderTypes } from './usePaginateOrderTypes';

/* =====================================================
 * Orders & Fulfillment
 * ===================================================== */

export { default as useSalesOrderCreate } from './useSalesOrderCreate';
export { default as usePaginatedOrders } from './usePaginatedOrders';
export { useOrderDetails, useOrderItemById } from './useOrderDetails';
export { default as useUpdateOrderStatus } from './useUpdateOrderStatus';

export { default as useInitiateOutboundFulfillment } from './useInitiateOutboundFulfillment';
export { default as usePaginatedOutboundFulfillments } from './usePaginatedOutboundFulfillments';
export { default as useOutboundShipmentDetails } from './useOutboundShipmentDetails';
export { default as useConfirmOutboundFulfillment } from './useConfirmOutboundFulfillment';
export { default as useCompleteManualFulfillment } from './useCompleteManualFulfillment';

/* =====================================================
 * Inventory & Allocation
 * ===================================================== */

export { default as useAllocateInventory } from './useAllocateInventory';
export { default as useInventoryAllocationReview } from './useInventoryAllocationReview';
export { default as useInventoryAllocationConfirmation } from './useInventoryAllocationConfirmation';
export { default as usePaginatedInventoryAllocations } from './usePaginatedInventoryAllocations';

export { useBaseInventoryActivityLogs } from './useInventoryActivityLogs';

/* =====================================================
 * Location & Warehouse
 * ===================================================== */

export { default as useLocations } from './useLocations';
export { default as useLocationTypes } from './useLocationTypes';
export { default as useLocationTypeDetail } from './useLocationTypeDetail';

export { default as useLocationInventory } from './useLocationInventory';
export { default as useLocationInventorySummary } from './useLocationInventorySummary';
export { default as useLocationInventorySummaryByItemId } from './useLocationInventorySummaryByItemId';
export { default as useLocationInventoryKpiSummary } from './useLocationInventoryKpiSummary';

export { default as useWarehouses } from './useWarehouses';
export { default as useWarehouseDetails } from './useWarehouseDetails';
export { default as useWarehouseInventory } from './useWarehouseInventory';
export { default as useWarehouseInventoryItemSummary } from './useWarehouseInventoryItemSummary';
export { default as useWarehouseInventorySummaryByItemId } from './useWarehouseInventorySummaryByItemId';
export { default as useAdjustWarehouseInventory } from './useAdjustWarehouseInventory';
export { default as useCreateWarehouseInventory } from './useCreateWarehouseInventory';

/* =====================================================
 * Lookups (Dropdown / Reference Data)
 * ===================================================== */

export { default as useBatchRegistryLookup } from './useBatchRegistryLookup';
export { default as useWarehouseLookup } from './useWarehouseLookup';
export { default as useProductLookup } from './useProductLookup';
export { default as usePackagingMaterialLookup } from './usePackagingMaterialLookup';
export { default as useLotAdjustmentTypeLookup } from './useLotAdjustmentTypeLookup';
export { default as useOrderTypeLookup } from './useOrderTypeLookup';
export { default as useDeliveryMethodLookup } from './useDeliveryMethodLookup';
export { default as usePaymentMethodLookup } from './usePaymentMethodLookup';
export { default as useDiscountLookup } from './useDiscountLookup';
export { default as useTaxRateLookup } from './useTaxRateLookup';
export { default as useStatusLookup } from './useStatusLookup';
export { default as useUserLookup } from './useUserLookup';
export { default as useRoleLookup } from './useRoleLookup';

/* =====================================================
 * Misc
 * ===================================================== */

export { default as useTheme } from './useThemeMode';
