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
export * from './lookupThunks';
export * from './lookupTypes';
