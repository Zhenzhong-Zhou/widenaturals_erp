import inventoryActivityLogsReducer from './inventoryActivityLogsSlice';

export const reportReducers = {
  inventoryActivityLogs: inventoryActivityLogsReducer,
};

// Optional: export thunks, selectors, types if you need
export * from './inventoryActivityLogsSelectors';
export * from './reportThunks';
export * from './reportTypes';
