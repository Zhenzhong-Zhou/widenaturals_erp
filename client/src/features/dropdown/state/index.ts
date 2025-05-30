import batchRegistryDropdownReducer from './batchRegistryDropdownSlice';

export const dropdownReducers = {
  batchRegistryDropdown: batchRegistryDropdownReducer,
};

// Optionally export selectors, thunks, types
export * from './batchRegistryDropdownSlice';
export * from './dropdownThunks';
export * from './dropdownTypes';
