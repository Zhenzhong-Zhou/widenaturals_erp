import allocateInventoryReducer from './allocateInventorySlice';
import inventoryAllocationReviewReducer from './inventoryAllocationReviewSlice';

export const inventoryAllocationReducers = {
  allocateInventory: allocateInventoryReducer,
  inventoryAllocationReview: inventoryAllocationReviewReducer,
};

// Optional exports for thunks, selectors, types
export * from './allocateInventorySelectors';
export * from './inventoryAllocationReviewSelectors';
export * from './inventoryAllocationThunks';
export * from './inventoryAllocationTypes';
