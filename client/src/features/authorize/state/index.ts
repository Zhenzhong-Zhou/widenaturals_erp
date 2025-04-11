import permissionsReducer from './permissionSlice';

export const authorizeReducers = {
  permissions: permissionsReducer,
};

// Optional: export other state-related logic
export * from './permissionSelector';
export * from './authorizeThunk';
