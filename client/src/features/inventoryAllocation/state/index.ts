import allocateInventoryReducer from './allocateInventorySlice';
import inventoryAllocationReviewReducer from './inventoryAllocationReviewSlice';
import paginatedInventoryAllocationsReducer from './paginatedInventoryAllocationsSlice';
import inventoryAllocationConfirmationReducer from './inventoryAllocationConfirmationSlice';

export const inventoryAllocationReducers = {
  allocateInventory: allocateInventoryReducer,
  inventoryAllocationReview: inventoryAllocationReviewReducer,
  paginatedInventoryAllocations: paginatedInventoryAllocationsReducer,
  inventoryAllocationConfirmation: inventoryAllocationConfirmationReducer,
};

// Optional exports for thunks, selectors, types
export * from './allocateInventorySelectors';
export * from './inventoryAllocationReviewSelectors';
export * from './paginatedInventoryAllocationsSelectors';
export * from './inventoryAllocationConfirmationSelectors';
export * from './inventoryAllocationThunks';
export * from './inventoryAllocationTypes';
