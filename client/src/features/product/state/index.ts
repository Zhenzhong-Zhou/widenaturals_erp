import createProductsReducer from './createProductsSlice';

export const productReducers = {
  createProducts: createProductsReducer,
};

// Optional exports for types, selectors, and thunks
export * from './createProductsSelectors';
export * from './productThunks';
export * from './productTypes';
