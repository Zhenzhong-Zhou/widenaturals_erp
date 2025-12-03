import pricingListReducer from './pricingListSlice';
import pricingListByTypeReducer from './pricingListByTypeSlice';

export const pricingReducers = {
  pricingList: pricingListReducer,
  pricingListByType: pricingListByTypeReducer,
};

// Optional: Export thunks, selectors, types
export * from './pricingListSelectors';
export * from './pricingListByTypeSelectors';
export * from './pricingThunks';
export * from './pricingTypes';
