import discountDropdownReducer from './discountDropdownSlice';

export const discountReducers = {
  discountDropdown: discountDropdownReducer,
};

// Optional: export selectors, thunks, or types
export * from './discountSelectors';
export * from './discountThunks';
export * from './discountTypes';
