import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';
import paginatedSkusReducer from './paginatedSkusSlice';
import createSkusReducer from './createSkusSlice';
import skuStatusReducer from './skuStatusSlice';

export const skuReducers = {
  skuProductCards: skuProductCardsReducer,
  skuDetail: skuDetailReducer,
  paginatedSkus: paginatedSkusReducer,
  createSkus: createSkusReducer,
  skuStatus: skuStatusReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuProductCardsSelectors';
export * from './skuDetailSelectors';
export * from './paginatedSkusSelectors';
export * from './createSkusSelectors';
export * from './skuStatusSelectors';
export * from './skuThunks';
export * from './skuTypes';
