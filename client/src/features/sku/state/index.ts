import skuDetailReducer from './skuDetailSlice';

export const skuReducers = {
  skuDetail: skuDetailReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuDetailSelectors';
export * from './skuThunks';
export * from './skuTypes';
