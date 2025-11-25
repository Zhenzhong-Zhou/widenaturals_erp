import batchRegistryLookupReducer from './batchRegistryLookupSlice';
import warehouseLookupReducer from './warehouseLookupSlice';
import lotAdjustmentTypeLookupReducer from './lotAdjustmentTypeLookupSlice';
import customerLookupLookupReducer from './customerLookupSlice';
import addressByCustomerReducer from './addressByCustomerLookupSlice';
import orderTypeLookupReducer from './orderTypeLookupSlice';
import paymentMethodLookupReducer from './paymentMethodLookupSlice';
import discountLookupReducer from './discountLookupSlice';
import taxRateLookupReducer from './taxRateLookupSlice';
import deliveryMethodLookupReducer from './deliveryMethodLookupSlice';
import skuLookupReducer from './skuLookupSlice';
import pricingLookupReducer from './pricingLookupSlice';
import packagingMaterialLookupReducer from './packagingMaterialLookupSlice';
import skuCodeBaseLookupReducer from './skuCodeBaseLookupSlice';
import productLookupReducer from './productLookupSlice';

export const lookupReducers = {
  batchRegistryLookup: batchRegistryLookupReducer,
  warehouseLookup: warehouseLookupReducer,
  lotAdjustmentTypeLookup: lotAdjustmentTypeLookupReducer,
  customerLookup: customerLookupLookupReducer,
  addressByCustomer: addressByCustomerReducer,
  orderTypeLookup: orderTypeLookupReducer,
  paymentMethodLookup: paymentMethodLookupReducer,
  discountLookup: discountLookupReducer,
  taxRateLookup: taxRateLookupReducer,
  deliveryMethodLookup: deliveryMethodLookupReducer,
  skuLookup: skuLookupReducer,
  pricingLookup: pricingLookupReducer,
  packagingMaterialLookup: packagingMaterialLookupReducer,
  skuCodeBaseLookup: skuCodeBaseLookupReducer,
  productLookup: productLookupReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryLookupSelectors';
export * from './warehouseLookupSelectors';
export * from './lotAdjustmentTypeLookupSelectors';
export * from './customerLookupSelectors';
export * from './addressByCustomerLookupSelectors';
export * from './orderTypeLookupSelectors';
export * from './paymentMethodLookupSelectors';
export * from './discountLookupSelectors';
export * from './taxRateLookupSelectors';
export * from './deliveryMethodLookupSelectors';
export * from './skuLookupSelectors';
export * from './pricingLookupSelectors';
export * from './packagingMaterialLookupSelectors';
export * from './skuCodeBaseLookupSelectors';
export * from './productLookupSelectors';
export * from './lookupThunks';
export * from './lookupTypes';
