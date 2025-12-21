import initiateOutboundFulfillmentReducer from './initiateOutboundFulfillmentSlice';
import paginatedOutboundFulfillmentsReducer from './paginatedOutboundFulfillmentsSlice';
import outboundShipmentDetailsReducer from './outboundShipmentDetailsSlice';
import confirmOutboundFulfillmentReducer from './confirmOutboundFulfillmentSlice';
import completeManualFulfillmentReducer from './completeManualFulfillmentSlice';

/**
 * Reducer map for the Outbound Fulfillment feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `outboundFulfillment` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for outbound fulfillment workflows.
 */
export const outboundFulfillmentReducers = {
  /** Initiation of outbound fulfillment workflows */
  initiateOutboundFulfillment: initiateOutboundFulfillmentReducer,
  
  /** Paginated list of outbound fulfillments */
  paginatedOutboundFulfillments: paginatedOutboundFulfillmentsReducer,
  
  /** Outbound shipment detail view */
  outboundShipmentDetails: outboundShipmentDetailsReducer,
  
  /** Confirmation step for outbound fulfillment */
  confirmOutboundFulfillment: confirmOutboundFulfillmentReducer,
  
  /** Manual completion of outbound fulfillment */
  completeManualFulfillment: completeManualFulfillmentReducer,
};
