import batchRegistryDropdownReducer from './batchRegistryDropdownSlice';
import warehouseDropdownDropdownReducer from './warehouseDropdownSlice';

export const dropdownReducers = {
  batchRegistryDropdown: batchRegistryDropdownReducer,
  warehouseDropdown: warehouseDropdownDropdownReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryDropdownSelectors';
export * from './warehouseDropdownSelectors';
export * from './dropdownThunks';
export * from './dropdownTypes';
