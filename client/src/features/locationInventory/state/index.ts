import locationInventorySummaryReducer from './locationInventorySummarySlice';
import locationInventorySummaryDetailReducer from './locationInventorySummaryDetailSlice';

export const locationInventoryReducers = {
  locationInventorySummary: locationInventorySummaryReducer,
  locationInventorySummaryDetail: locationInventorySummaryDetailReducer,
};

// Optional: Export selectors, thunks, and types
export * from './locationInventorySummarySelectors';
export * from './locationInventoryThunks';
export * from './locationInventoryTypes';
