import productsReducer from './productSlice';
import productReducer from './productDetailSlice';
import productOrderDropdownReducer from './productOrderDropdownSlice';

export const productReducers = {
  products: productsReducer,
  product: productReducer,
  productOrderDropdown: productOrderDropdownReducer,
};

// Optional exports for types, selectors, and thunks
export * from './productSelectors';
export * from './productThunks';
export * from './productTypes';
