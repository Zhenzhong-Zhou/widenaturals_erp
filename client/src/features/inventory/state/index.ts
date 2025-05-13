import inventoriesReducer from './inventorySlice';

export const inventoryReducers = {
  inventories: inventoriesReducer,
};

// Optional: Export selectors, thunks, and types
export * from './inventorySelectors';
export * from './inventoryThunks';
export * from './inventoryTypes';
