import batchRegistryLookupReducer from './batchRegistryLookupSlice';
import warehouseLookupReducer from './warehouseLookupSlice';
import lotAdjustmentTypeLookupReducer from './lotAdjustmentTypeLookupSlice';

export const lookupReducers = {
  batchRegistryLookup: batchRegistryLookupReducer,
  warehouseLookup: warehouseLookupReducer,
  lotAdjustmentTypeLookup: lotAdjustmentTypeLookupReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryLookupSelectors';
export * from './warehouseLookupSelectors';
export * from './lotAdjustmentTypeLookupSelectors';
export * from './lookupThunks';
export * from './lookupTypes';
