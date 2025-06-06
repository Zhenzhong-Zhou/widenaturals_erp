import batchRegistryDropdownReducer from './batchRegistryDropdownSlice';
import warehouseDropdownDropdownReducer from './warehouseDropdownSlice';
import lotAdjustmentTypeDropdownReducer from './lotAdjustmentTypeDropdownSlice';

export const dropdownReducers = {
  batchRegistryDropdown: batchRegistryDropdownReducer,
  warehouseDropdown: warehouseDropdownDropdownReducer,
  lotAdjustmentTypeDropdown: lotAdjustmentTypeDropdownReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryDropdownSelectors';
export * from './warehouseDropdownSelectors';
export * from './lotAdjustmentTypeDropdownSelectors';
export * from './dropdownThunks';
export * from './dropdownTypes';
