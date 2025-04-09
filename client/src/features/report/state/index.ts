import adjustmentReportReducer from './adjustmentReportSlice';
import inventoryActivityLogsReducer from './inventoryActivityLogsSlice';
import inventoryHistoryReducer from './inventoryHistorySlice';

export const reportReducers = {
  adjustmentReport: adjustmentReportReducer,
  inventoryActivityLogs: inventoryActivityLogsReducer,
  inventoryHistory: inventoryHistoryReducer,
};

// Optional: export thunks, selectors, types if you need
export * from './adjustmentReportSelectors';
export * from './inventoryActivityLogsSelectors';
export * from './inventoryHistorySelectors';
export * from './reportThunks';
export * from './reportTypes';