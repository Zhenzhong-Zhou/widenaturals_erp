import paginatedBomReducer from './paginatedBomsSlice';
import bomDetailsReducer from './bomDetailsSlice';
import bomMaterialSupplyDetailsReducer from './bomMaterialSupplyDetailsSlice';
import bomProductionReadinessReducer from './bomProductionReadinessSlice';

export const bomReducers = {
  paginatedBoms: paginatedBomReducer,
  bomDetails: bomDetailsReducer,
  bomMaterialSupplyDetails: bomMaterialSupplyDetailsReducer,
  bomProductionReadiness: bomProductionReadinessReducer,
};

// Optional exports for thunks, selectors, types
export * from './paginatedBomSelectors';
export * from './bomDetailsSelectors';
export * from './bomMaterialSupplyDetailsSelectors';
export * from './bomProductionReadinessSelectors';
export * from './bomThunks';
export * from './bomTypes';
