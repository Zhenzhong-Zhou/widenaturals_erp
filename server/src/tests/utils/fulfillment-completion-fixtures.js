const buildUniqueTrackingNumber = (prefix = 'RA') => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

const buildDefaultCarrierTrackings = () => [
  {
    carrier: 'Canada Post',
    trackingNumber: buildUniqueTrackingNumber('RA'),
    serviceName: 'Expedited Parcel',
  },
  {
    carrier: 'Canada Post',
    trackingNumber: buildUniqueTrackingNumber('RA'),
    serviceName: 'Expedited Parcel',
    customNotes: 'Second carton',
  },
];

/**
 * Builds the completion payload the service expects.
 * The service determines target statuses from the shipment's
 * delivery method, so the payload only carries trackings.
 *
 * - Pickup: empty payload, server picks COMPLETED with no trackings.
 * - Carrier-tracked: trackings + server picks IN_TRANSIT.
 * - Non-tracked freight: trackings (BOL) + server picks COMPLETED.
 */
const buildCompletionPayload = ({ isPickup, trackings } = {}) => {
  if (isPickup) return {};
  return { trackings: trackings ?? buildDefaultCarrierTrackings() };
};

/**
 * Negative-path fixture: pickup-method shipment with trackings —
 * service must reject via assertDeliveryMethodAllowsTracking.
 */
const buildInvalidPickupWithTrackings = () => ({
  trackings: buildDefaultCarrierTrackings(),
});

module.exports = {
  buildUniqueTrackingNumber,
  buildDefaultCarrierTrackings,
  buildCompletionPayload,
  buildInvalidPickupWithTrackings,
};
