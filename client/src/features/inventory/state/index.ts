import inventoriesReducer from './inventorySlice';
import inventorySummaryReducer from './inventorySummarySlice';

export const inventoryReducers = {
  inventories: inventoriesReducer,
  inventorySummary: inventorySummaryReducer,
};

// Optional: Export selectors, thunks, and types
export * from './inventorySelectors';
export * from './inventoryThunks';
export * from './inventoryTypes';