import skuImageUploadReducer from './skuImageUploadSlice';

export const skuImageReducers = {
  skuImageUpload: skuImageUploadReducer,
};

// Optional exports for thunks, selectors, types
export * from './skuImageUploadSelectors';
export * from './skuImageThunks';
export * from './skuImageTypes';
