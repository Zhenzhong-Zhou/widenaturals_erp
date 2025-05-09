import skuProductCardsReducer from './skuProductCardSlice.ts';

export const skuReducers = {
  skuProductCards: skuProductCardsReducer,
};

// Optional exports for types, selectors, and thunks
export * from './skuProductCardSelectors.ts';
export * from './skuThunks.ts';
export * from './skuTypes.ts';
