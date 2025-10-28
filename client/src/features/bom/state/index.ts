import paginatedBomReducer from './paginatedBomsSlice';
import bomDetailsReducer from './bomDetailsSlice';

export const bomReducers = {
  paginatedBoms: paginatedBomReducer,
  bomDetails: bomDetailsReducer,
};

// Optional exports for thunks, selectors, types
export * from './paginatedBomSelectors';
export * from './bomDetailsSelectors';
export * from './bomThunks';
export * from './bomTypes';
