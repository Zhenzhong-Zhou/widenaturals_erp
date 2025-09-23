import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';

export const outboundFulfillmentReducers = {
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer
};

// Optional exports for thunks, selectors, types
export * from './initiateOutboundFulfillmentSelectors';
export * from './outboundFulfillmentThunks';
export * from './outboundFulfillmentTypes';
