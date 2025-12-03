import paginatedProductsReducer from './paginatedProductsSlice';
import createProductsReducer from './createProductsSlice';
import productDetailReducer from './productDetailSlice';

export const productReducers = {
  paginatedProducts: paginatedProductsReducer,
  createProducts: createProductsReducer,
  productDetail: productDetailReducer,
};

// Optional exports for types, selectors, and thunks
export * from './paginatedProductsSelectors';
export * from './createProductsSelectors';
export * from './productDetailSelectors';
export * from './productThunks';
export * from './productTypes';
