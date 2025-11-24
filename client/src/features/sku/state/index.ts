import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';
import paginatedSkusReducer from './paginatedSkusSlice';
import createSkusReducer from './createSkusSlice';

export const skuReducers = {
  skuProductCards: skuProductCardsReducer,
  skuDetail: skuDetailReducer,
  paginatedSkus: paginatedSkusReducer,
  createSkus: createSkusReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuProductCardsSelectors';
export * from './skuDetailSelectors';
export * from './paginatedSkusSelectors';
export * from './createSkusSelectors';
export * from './skuThunks';
export * from './skuTypes';
