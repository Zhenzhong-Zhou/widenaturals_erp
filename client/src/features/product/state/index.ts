import skuProductCardsReducer from './skuProductCardSlice';
import skuDetailsReducer from './skuDetailsSlice';

export const productReducers = {
  skuProductCards: skuProductCardsReducer,
  skuDetails: skuDetailsReducer,
};

// Optional exports for types, selectors, and thunks
export * from './skuProductCardSelectors.ts';
export * from './skuThunks.ts';
export * from './skuTypes.ts';
