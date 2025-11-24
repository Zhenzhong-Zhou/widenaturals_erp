import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';
import paginatedSkusReducer from './paginatedSkusSlice';

export const skuReducers = {
  skuProductCards: skuProductCardsReducer,
  skuDetail: skuDetailReducer,
  paginatedSkus: paginatedSkusReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuProductCardsSelectors';
export * from './skuDetailSelectors';
export * from './paginatedSkusSelectors';
export * from './skuThunks';
export * from './skuTypes';
