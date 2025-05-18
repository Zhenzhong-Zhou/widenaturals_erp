import locationInventorySummaryReducer from './locationInventorySummarySlice.ts';

export const locationInventoryReducers = {
  locationInventorySummary: locationInventorySummaryReducer,
};

// Optional: Export selectors, thunks, and types
export * from './locationInventorySummarySelectors.ts';
export * from './locationInventoryThunks.ts';
export * from './locationInventoryTypes.ts';
