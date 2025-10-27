import paginatedBomReducer from './paginatedBomsSlice';

export const bomReducers = {
  paginatedBoms: paginatedBomReducer,
};

// Optional exports for thunks, selectors, types
export * from './paginatedBomSelectors';
export * from './bomThunks';
export * from './bomTypes';
