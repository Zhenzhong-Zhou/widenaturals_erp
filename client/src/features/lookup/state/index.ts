import batchRegistryLookupReducer from './batchRegistryLookupSlice';
import warehouseLookupReducer from './warehouseLookupSlice';
import lotAdjustmentTypeLookupReducer from './lotAdjustmentTypeLookupSlice';
import customerLookupLookupReducer from './customerLookupSlice';

export const lookupReducers = {
  batchRegistryLookup: batchRegistryLookupReducer,
  warehouseLookup: warehouseLookupReducer,
  lotAdjustmentTypeLookup: lotAdjustmentTypeLookupReducer,
  customerLookup: customerLookupLookupReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryLookupSelectors';
export * from './warehouseLookupSelectors';
export * from './lotAdjustmentTypeLookupSelectors';
export * from './customerLookupSelectors';
export * from './lookupThunks';
export * from './lookupTypes';
