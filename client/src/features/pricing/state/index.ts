import pricingListReducer from './pricingListSlice.ts';
// import pricingReducer from './pricingDetailSlice';
import pricingValueReducer from './pricingValueSlice';

export const pricingReducers = {
  pricingList: pricingListReducer,
  // pricing: pricingReducer,
  pricingValue: pricingValueReducer,
};

// Optional: Export thunks, selectors, types
export * from './pricingListSelectors';
export * from './pricingDetailSelectors';
export * from './pricingValueSelectors';
export * from './pricingThunks';
export * from './pricingTypes';
