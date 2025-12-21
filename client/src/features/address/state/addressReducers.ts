import addressCreationReducer from './addressCreationSlice';
import paginateAddressReducer from './paginateAddressSlice';

/**
 * Reducer map for the Address feature.
 *
 * This object is consumed exclusively by the root reducer
 * to compose the address state subtree.
 *
 * IMPORTANT:
 * - Reducer aggregators must import slice reducers directly
 *   (never from feature index files) to avoid circular
 *   dependencies and ESM initialization (TDZ) errors.
 * - This file must remain free of store, rootReducer,
 *   or feature index imports.
 */
export const addressReducers = {
  /** Handles address creation and mutation state */
  addressCreation: addressCreationReducer,
  
  /** Handles paginated address listing state */
  paginatedAddress: paginateAddressReducer,
};
