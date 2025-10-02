import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';
import paginatedOutboundFulfillmentsReducer from './paginatedOutboundFulfillmentsSlice';
import outboundShipmentDetailsReducer from './outboundShipmentDetailsSlice';

export const outboundFulfillmentReducers = {
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer,
  paginatedOutboundFulfillments: paginatedOutboundFulfillmentsReducer,
  outboundShipmentDetails: outboundShipmentDetailsReducer,
};

// Optional exports for thunks, selectors, types
export * from './initiateOutboundFulfillmentSelectors';
export * from './paginatedOutboundFulfillmentsSelectors';
export * from './outboundShipmentDetailsSelectors';
export * from './outboundFulfillmentThunks';
export * from './outboundFulfillmentTypes';
