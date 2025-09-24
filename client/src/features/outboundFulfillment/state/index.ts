import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';
import paginatedOutboundFulfillmentsReducer from './paginatedOutboundFulfillmentsSlice';

export const outboundFulfillmentReducers = {
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer,
  paginatedOutboundFulfillments: paginatedOutboundFulfillmentsReducer,
};

// Optional exports for thunks, selectors, types
export * from './initiateOutboundFulfillmentSelectors';
export * from './paginatedOutboundFulfillmentsSelectors';
export * from './outboundFulfillmentThunks';
export * from './outboundFulfillmentTypes';
