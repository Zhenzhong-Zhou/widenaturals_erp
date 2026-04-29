const { getStatusId } = require('../../config/status-cache');
const {
  getBatchActivityTypeId,
} = require('../../cache/batch-activity-type-cache');

/**
 * Lazily initialized lifecycle → activity mapping.
 *
 * The map is constructed only on first access to ensure that
 * status and activity caches are already initialized.
 *
 * @type {Readonly<Record<string,string>> | null}
 */
let BATCH_ACTIVITY_MAP = null;

/**
 * Retrieve the immutable lifecycle activity map.
 *
 * Lazy initialization avoids startup crashes caused by cache
 * dependencies not yet being loaded during module import.
 *
 * @returns {Readonly<Record<string,string>>}
 */
const getBatchActivityMap = () => {
  if (!BATCH_ACTIVITY_MAP) {
    BATCH_ACTIVITY_MAP = Object.freeze({
      [getStatusId('batch_received')]: getBatchActivityTypeId('BATCH_RECEIVED'),
      [getStatusId('batch_quarantined')]:
        getBatchActivityTypeId('BATCH_QUARANTINED'),
      [getStatusId('batch_released')]: getBatchActivityTypeId('BATCH_RELEASED'),
    });
  }

  return BATCH_ACTIVITY_MAP;
};

/**
 * Resolve the audit activity type associated with a batch status change.
 *
 * Behavior:
 * 1. If `statusId` is null or undefined → return null
 * 2. If the status exists in the lifecycle map → return mapped activity
 * 3. Otherwise → fall back to generic `BATCH_STATUS_CHANGED`
 *
 * Performance:
 * - O(1) lookup
 * - immutable lifecycle map
 *
 * @param {Readonly<Record<string,string>>} activityMap
 * Lifecycle activity mapping.
 *
 * @param {string|null|undefined} statusId
 * Batch status identifier.
 *
 * @returns {string|null}
 * Activity type identifier used for audit logging.
 */
const resolveBatchActivityType = (activityMap, statusId) => {
  if (!statusId) return null;

  return (
    activityMap[statusId] ?? getBatchActivityTypeId('BATCH_STATUS_CHANGED')
  );
};

/**
 * Resolve activity type for batch lifecycle changes.
 *
 * This helper fetches the lifecycle map lazily and delegates
 * resolution to the shared resolver.
 *
 * @param {string|null|undefined} statusId
 * Batch status identifier.
 *
 * @returns {string|null}
 */
const getBatchActivityType = (statusId) => {
  const activityMap = getBatchActivityMap();

  return resolveBatchActivityType(activityMap, statusId);
};

module.exports = {
  resolveBatchActivityType,
  getBatchActivityType,
};
