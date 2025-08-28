import allocateInventoryReducer from './allocateInventorySlice';

export const inventoryAllocationReducers = {
  allocateInventory: allocateInventoryReducer,
};

// Optional exports for thunks, selectors, types
export * from './allocateInventorySelectors';
export * from './inventoryAllocationThunks';
export * from './inventoryAllocationTypes';
