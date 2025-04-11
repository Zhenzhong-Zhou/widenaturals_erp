import locationReducer from './locationSlice';

export const locationReducers = {
  locations: locationReducer,
};

// Optional: export thunks, selectors, and types
export * from './locationSelectors';
export * from './locationThunks';
export * from './locationTypes';
