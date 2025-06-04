import pricingListReducer from './pricingListSlice';
import pricingListByTypeReducer from './pricingListByTypeSlice';
// import pricingValueReducer from './pricingValueSlice';

export const pricingReducers = {
  pricingList: pricingListReducer,
  pricingListByType: pricingListByTypeReducer,
  // pricingValue: pricingValueReducer,
};

// Optional: Export thunks, selectors, types
export * from './pricingListSelectors';
export * from './pricingListByTypeSelectors';
export * from './pricingValueSelectors';
export * from './pricingThunks';
export * from './pricingTypes';
