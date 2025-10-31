import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';
import paginatedOutboundFulfillmentsReducer from './paginatedOutboundFulfillmentsSlice';
import outboundShipmentDetailsReducer from './outboundShipmentDetailsSlice';
import confirmOutboundFulfillmentReducer from './confirmOutboundFulfillmentSlice';
import completeManualFulfillmentReducer from './completeManualFulfillmentSlice';

export const outboundFulfillmentReducers = {
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer,
  paginatedOutboundFulfillments: paginatedOutboundFulfillmentsReducer,
  outboundShipmentDetails: outboundShipmentDetailsReducer,
  confirmOutboundFulfillment: confirmOutboundFulfillmentReducer,
  completeManualFulfillment: completeManualFulfillmentReducer,
};

// Optional exports for thunks, selectors, types
export * from './initiateOutboundFulfillmentSelectors';
export * from './paginatedOutboundFulfillmentsSelectors';
export * from './outboundShipmentDetailsSelectors';
export * from './confirmOutboundFulfillmentSelectors';
export * from './completeManualFulfillmentSelectors';
export * from './outboundFulfillmentThunks';
export * from './outboundFulfillmentTypes';
