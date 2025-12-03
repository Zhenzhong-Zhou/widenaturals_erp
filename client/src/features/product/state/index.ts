import paginatedProductsReducer from './paginatedProductsSlice';
import createProductsReducer from './createProductsSlice';

export const productReducers = {
  paginatedProducts: paginatedProductsReducer,
  createProducts: createProductsReducer,
};

// Optional exports for types, selectors, and thunks
export * from './paginatedProductsSelectors';
export * from './createProductsSelectors';
export * from './productThunks';
export * from './productTypes';
