import taxRateDropdownReducer from './taxRateDropdownSlice';

export const taxRateReducers = {
  taxRateDropdown: taxRateDropdownReducer,
};

// Optional: export thunks, selectors, types if needed
export * from './taxRateDropdownSelectors';
export * from './taxRateThunks';
export * from './taxRateTypes';
