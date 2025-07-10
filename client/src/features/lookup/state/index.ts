import batchRegistryLookupReducer from './batchRegistryLookupSlice';
import warehouseLookupReducer from './warehouseLookupSlice';
import lotAdjustmentTypeLookupReducer from './lotAdjustmentTypeLookupSlice';
import customerLookupLookupReducer from './customerLookupSlice';
import addressByCustomerReducer from './addressByCustomerLookupSlice';

export const lookupReducers = {
  batchRegistryLookup: batchRegistryLookupReducer,
  warehouseLookup: warehouseLookupReducer,
  lotAdjustmentTypeLookup: lotAdjustmentTypeLookupReducer,
  customerLookup: customerLookupLookupReducer,
  addressByCustomer: addressByCustomerReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryLookupSelectors';
export * from './warehouseLookupSelectors';
export * from './lotAdjustmentTypeLookupSelectors';
export * from './customerLookupSelectors';
export * from './addressByCustomerLookupSelectors';
export * from './lookupThunks';
export * from './lookupTypes';
