const { cleanObject } = require('./object-utils');
const { getFullName } = require('./name-utils');

/**
 * @typedef {Object} Actor
 * @property {string|null} [id]
 * @property {string|null} [name]
 */

/**
 * Build a normalized actor object from flat user fields.
 *
 * An "actor" represents **who** performed a lifecycle action,
 * not **when** the action occurred.
 *
 * Intended for lifecycle events such as:
 * - releasedBy
 * - approvedBy
 * - fulfilledBy
 * - performedBy
 *
 * IMPORTANT:
 * - This helper intentionally does NOT include timestamps.
 * - Event time (e.g. releasedAt, approvedAt) must be modeled
 *   separately by the caller.
 * - This helper is NOT an audit utility.
 *
 * @param {string|null} id
 * @param {string|null} firstName
 * @param {string|null} lastName
 * @returns {Actor|null}
 */
const makeActor = (id, firstName, lastName) => {
  if (!id && !firstName && !lastName) return null;

  const name = getFullName(firstName, lastName) || null;

  return cleanObject({
    id,
    name,
  });
};

module.exports = {
  makeActor,
};
