import paginatedProductsReducer from './paginatedProductsSlice';
import createProductsReducer from './createProductsSlice';
import productDetailReducer from './productDetailSlice';
import productStatusUpdateReducer from './productStatusUpdateSlice';
import productInfoUpdateReducer from './productInfoUpdateSlice';

export const productReducers = {
  paginatedProducts: paginatedProductsReducer,
  createProducts: createProductsReducer,
  productDetail: productDetailReducer,
  productStatusUpdate: productStatusUpdateReducer,
  productInfoUpdate: productInfoUpdateReducer,
};

// Optional exports for types, selectors, and thunks
export * from './paginatedProductsSelectors';
export * from './createProductsSelectors';
export * from './productDetailSelectors';
export * from './productStatusUpdateSelectors';
export * from './productInfoUpdateSelectors';
export * from './productThunks';
export * from './productTypes';
