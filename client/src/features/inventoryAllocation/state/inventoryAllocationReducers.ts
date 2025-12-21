import allocateInventoryReducer from './allocateInventorySlice';
import inventoryAllocationReviewReducer from './inventoryAllocationReviewSlice';
import paginatedInventoryAllocationsReducer from './paginatedInventoryAllocationsSlice';
import inventoryAllocationConfirmationReducer from './inventoryAllocationConfirmationSlice';

/**
 * Reducer map for the Inventory Allocation feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `inventoryAllocation` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for inventory allocation workflows.
 */
export const inventoryAllocationReducers = {
  /** Inventory allocation creation and editing workflow */
  allocateInventory: allocateInventoryReducer,
  
  /** Review and validation of inventory allocations */
  inventoryAllocationReview: inventoryAllocationReviewReducer,
  
  /** Paginated inventory allocation list and filters */
  paginatedInventoryAllocations: paginatedInventoryAllocationsReducer,
  
  /** Confirmation and finalization of inventory allocations */
  inventoryAllocationConfirmation: inventoryAllocationConfirmationReducer,
};
