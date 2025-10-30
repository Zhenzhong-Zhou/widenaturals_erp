import paginatedBomReducer from './paginatedBomsSlice';
import bomDetailsReducer from './bomDetailsSlice';
import bomMaterialSupplyDetailsReducer from './bomMaterialSupplyDetailsSlice';

export const bomReducers = {
  paginatedBoms: paginatedBomReducer,
  bomDetails: bomDetailsReducer,
  bomMaterialSupplyDetails: bomMaterialSupplyDetailsReducer,
};

// Optional exports for thunks, selectors, types
export * from './paginatedBomSelectors';
export * from './bomDetailsSelectors';
export * from './bomMaterialSupplyDetailsSelectors';
export * from './bomThunks';
export * from './bomTypes';
