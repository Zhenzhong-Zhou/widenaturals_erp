const PICKUP_COMPLETION = {
  orderStatus: 'ORDER_DELIVERED',
  shipmentStatus: 'SHIPMENT_DELIVERED',
  fulfillmentStatus: 'FULFILLMENT_DELIVERED',
};

const CARRIER_COMPLETION_BASE = {
  orderStatus: 'ORDER_SHIPPED',
  shipmentStatus: 'SHIPMENT_READY',
  fulfillmentStatus: 'FULFILLMENT_SHIPPED',
};

const buildUniqueTrackingNumber = (prefix = 'RA') => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`; // e.g. RA-LWVPK0-A3F7
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

const buildCompletionPayload = ({ isPickup, trackings } = {}) => {
  if (isPickup) return { ...PICKUP_COMPLETION };
  return {
    ...CARRIER_COMPLETION_BASE,
    trackings: trackings ?? buildDefaultCarrierTrackings(),
  };
};

const buildInvalidPickupWithTrackings = () => ({
  ...PICKUP_COMPLETION,
  trackings: buildDefaultCarrierTrackings(),
});

module.exports = {
  PICKUP_COMPLETION,
  CARRIER_COMPLETION_BASE,
  buildUniqueTrackingNumber,
  buildDefaultCarrierTrackings,
  buildCompletionPayload,
  buildInvalidPickupWithTrackings,
};
