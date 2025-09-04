import allocateInventoryReducer from './allocateInventorySlice';
import inventoryAllocationReviewReducer from './inventoryAllocationReviewSlice';
import paginatedInventoryAllocationsReducer from './paginatedInventoryAllocationsSlice';

export const inventoryAllocationReducers = {
  allocateInventory: allocateInventoryReducer,
  inventoryAllocationReview: inventoryAllocationReviewReducer,
  paginatedInventoryAllocations: paginatedInventoryAllocationsReducer,
};

// Optional exports for thunks, selectors, types
export * from './allocateInventorySelectors';
export * from './inventoryAllocationReviewSelectors';
export * from './paginatedInventoryAllocationsSelectors';
export * from './inventoryAllocationThunks';
export * from './inventoryAllocationTypes';
