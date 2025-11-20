import skuProductCardsReducer from './skuProductCardSlice';

export const productReducers = {
  skuProductCards: skuProductCardsReducer,
};

// Optional exports for types, selectors, and thunks
export * from './skuProductCardSelectors';
export * from './productThunks';
export * from './productTypes';
