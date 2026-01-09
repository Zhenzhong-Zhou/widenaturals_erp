import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the outbound shipment details slice.
 */
const selectOutboundShipmentDetailsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.outboundShipmentDetails
);

/**
 * Selector: Fetches the shipment details data (ShipmentDetails or null).
 */
export const selectOutboundShipmentDetailsData = createSelector(
  [selectOutboundShipmentDetailsState],
  (detailsState) => detailsState.data
);

/**
 * Selector: Returns the loading state (true if a fetch is in progress).
 */
export const selectOutboundShipmentDetailsLoading = createSelector(
  [selectOutboundShipmentDetailsState],
  (detailsState) => detailsState.loading
);

/**
 * Selector: Returns the last error message (if any) from fetching shipment details.
 */
export const selectOutboundShipmentDetailsError = createSelector(
  [selectOutboundShipmentDetailsState],
  (detailsState) => detailsState.error
);

/**
 * Selector: Extracts only the shipment header object from details.
 * Returns null if details are not loaded.
 */
export const selectShipmentHeader = createSelector(
  [selectOutboundShipmentDetailsData],
  (data) => data?.shipment ?? null
);

/**
 * Selector: Extracts the fulfillments array from shipment details.
 * Returns an empty array if no data is loaded.
 */
export const selectShipmentFulfillments = createSelector(
  [selectOutboundShipmentDetailsData],
  (data) => data?.fulfillments ?? []
);

/**
 * Selector: Returns the number of fulfillment items in the shipment details.
 *
 * - Used for stable counts (e.g., badges, headers, summaries)
 * - Defaults to `0` if shipment details are not yet loaded
 */
export const selectShipmentFulfillmentsItemCount = createSelector(
  [selectOutboundShipmentDetailsData],
  (data) => data?.fulfillments.length ?? 0
);
