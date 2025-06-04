import warehouseReducer from './warehouseSlice';
import warehouseDetailsReducer from './warehouseDetailSlice';

export const warehouseReducers = {
  warehouses: warehouseReducer,
  warehouseDetails: warehouseDetailsReducer,
};

// Optional: export thunks, selectors, types here
export * from './warehouseSelectors';
export * from './warehouseThunks';
export * from './warehouseTypes';
