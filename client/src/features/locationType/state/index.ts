import locationTypesReducer from './locationTypesSlice';
import locationTypeReducer from './locationTypeDetailSlice';

export const locationTypeReducers = {
  locationTypes: locationTypesReducer,
  locationType: locationTypeReducer,
};

// Optional: Export selectors, thunks, types
export * from './locationTypesSelectors';
export * from './locationTypesThunks';
export * from './locationTypeTypes';