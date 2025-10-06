import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';
import paginatedOutboundFulfillmentsReducer from './paginatedOutboundFulfillmentsSlice';
import outboundShipmentDetailsReducer from './outboundShipmentDetailsSlice';
import confirmOutboundFulfillmentReducer from './confirmOutboundFulfillmentSlice';

export const outboundFulfillmentReducers = {
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer,
  paginatedOutboundFulfillments: paginatedOutboundFulfillmentsReducer,
  outboundShipmentDetails: outboundShipmentDetailsReducer,
  confirmOutboundFulfillment: confirmOutboundFulfillmentReducer,
};

// Optional exports for thunks, selectors, types
export * from './initiateOutboundFulfillmentSelectors';
export * from './paginatedOutboundFulfillmentsSelectors';
export * from './outboundShipmentDetailsSelectors';
export * from './confirmOutboundFulfillmentSelectors';
export * from './outboundFulfillmentThunks';
export * from './outboundFulfillmentTypes';
