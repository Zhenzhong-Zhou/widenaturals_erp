/**
 * Merges two inventory records by summing quantities and combining metadata fields.
 * This function mutates the first record (`a`) in-place.
 *
 * @param {Object} a - The base inventory record to be updated.
 * @param {Object} b - The incoming inventory record to merge into `a`.
 *
 * Fields merged:
 * - quantity, warehouse_quantity, location_quantity: summed
 * - inbound_date: latest date kept
 * - comments: concatenated if different
 * - meta: merged shallowly
 */
const mergeInventoryFields = (a, b) => {
  // Sum general quantity
  a.quantity = (a.quantity ?? 0) + (b.quantity ?? 0);

  // Sum warehouse-specific quantity
  a.warehouse_quantity =
    (a.warehouse_quantity ?? 0) + (b.warehouse_quantity ?? 0);

  // Sum location-specific quantity
  a.location_quantity = (a.location_quantity ?? 0) + (b.location_quantity ?? 0);

  // Use the later inbound date if both exist and are valid
  const dateA = new Date(a.inbound_date);
  const dateB = new Date(b.inbound_date);
  if (!isNaN(dateB) && (!a.inbound_date || dateB > dateA)) {
    a.inbound_date = b.inbound_date;
  }

  // Merge comments: append if both exist and are different
  if (a.comments && b.comments && a.comments !== b.comments) {
    a.comments = `${a.comments}; ${b.comments}`;
  } else {
    a.comments = a.comments || b.comments;
  }

  // Merge meta fields (shallow merge)
  a.meta = { ...(a.meta ?? {}), ...(b.meta ?? {}) };
};

module.exports = {
  mergeInventoryFields,
};
