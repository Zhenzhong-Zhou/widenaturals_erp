import locationInventoryKpiSummaryReducer from './locationInventoryKpiSummarySlice';
import locationInventorySummaryReducer from './locationInventorySummarySlice';
import locationInventorySummaryDetailReducer from './locationInventorySummaryDetailSlice';
import locationInventoryReducer from './locationInventorySlice';

export const locationInventoryReducers = {
  locationInventoryKpiSummary: locationInventoryKpiSummaryReducer,
  locationInventorySummary: locationInventorySummaryReducer,
  locationInventorySummaryDetail: locationInventorySummaryDetailReducer,
  locationInventory: locationInventoryReducer,
};

// Optional: Export selectors, thunks, and types
export * from './locationInventoryKpiSummarySelectors';
export * from './locationInventorySummarySelectors';
export * from './locationInventorySummaryDetailSelectors';
export * from './locationInventoryThunks';
export * from './locationInventoryTypes';
