import compliancesReducer from './complianceSlice';

export const complianceReducers = {
  compliances: compliancesReducer,
};

// Optionally export thunks, selectors, types
export * from './complianceSelectors';
export * from './complianceThunks';
export * from './complianceTypes';
