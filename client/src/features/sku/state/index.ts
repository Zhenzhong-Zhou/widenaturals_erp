import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';

export const skuReducers = {
  skuProductCards: skuProductCardsReducer,
  skuDetail: skuDetailReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuProductCardsSelectors';
export * from './skuDetailSelectors';
export * from './skuThunks';
export * from './skuTypes';
