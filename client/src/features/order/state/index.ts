import salesOrderCreationReducer from './salesOrderCreationSlice';

export const orderReducers = {
  salesOrderCreation: salesOrderCreationReducer,
};

// Optional exports for thunks, selectors, types
export * from './salesOrderCreationSelectors';
export * from './orderThunks';
export * from './orderTypes';
