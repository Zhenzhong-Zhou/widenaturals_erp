const Joi = require('joi');
const {
  validateUUID,
  optionalIsoDate
} = require('../general-validators');

//------------------------------------------------------------
// Shared lifecycle field validators
//------------------------------------------------------------

/**
 * Shared Joi validator for lifecycle notes.
 *
 * Used across batch lifecycle operations such as:
 * - status updates
 * - warehouse intake (receive)
 * - release / approval
 *
 * Constraints:
 * - optional
 * - trimmed
 * - maximum length of 2000 characters
 * - explicitly allows null values
 *
 * This validator is defined once to ensure consistent
 * validation behavior across all batch domains
 * (product batches, packaging material batches, etc.).
 *
 * Performance:
 * The schema is instantiated once at module load time
 * and reused across requests.
 */
const lifecycleNotes = Joi.string()
  .trim()
  .max(2000)
  .allow(null);


/**
 * Joi schema for updating lifecycle status.
 *
 * This schema validates the minimal payload required
 * for a lifecycle state transition.
 *
 * Supported operations include transitions such as:
 * - pending → received
 * - received → quarantined
 * - quarantined → released
 *
 * Fields:
 * - status_id (UUID, required)
 *     Target lifecycle status identifier.
 *
 * - notes (string | null)
 *     Optional lifecycle comment describing the change.
 *
 * Notes:
 * Domain-specific lifecycle automation (timestamps,
 * actors, or side effects) is handled in the service
 * or workflow layer rather than the validation layer.
 */
const lifecycleStatusUpdateSchema = Joi.object({
  // Target lifecycle status identifier
  status_id: validateUUID('Status ID').required(),
  
  // Optional lifecycle comment
  notes: lifecycleNotes,
}).unknown(false);


/**
 * Joi schema for receiving a batch into warehouse inventory.
 *
 * This schema validates intake payloads used during
 * warehouse receiving operations.
 *
 * Typical lifecycle transition:
 * pending → received
 *
 * Fields:
 * - received_at (ISO date, optional)
 *     Timestamp when the batch was physically received.
 *     If omitted, the service layer may automatically
 *     assign the current timestamp.
 *
 * - notes (string | null)
 *     Optional operational note recorded during intake.
 *
 * Notes:
 * The schema intentionally focuses only on user-supplied
 * data. System-generated metadata such as `received_by`
 * is injected by the service layer.
 */
const lifecycleReceiveSchema = Joi.object({
  // Optional warehouse intake timestamp
  received_at: optionalIsoDate('Received At'),
  
  // Optional intake comment
  notes: lifecycleNotes,
}).unknown(false);


//------------------------------------------------------------
// Export shared lifecycle validators
//------------------------------------------------------------

/**
 * Export shared lifecycle validators so they can be reused
 * across multiple domain validation modules.
 *
 * Typical consumers include:
 * - product batch validators
 * - packaging material batch validators
 * - future inventory lifecycle validators
 */
module.exports = {
  lifecycleNotes,
  lifecycleStatusUpdateSchema,
  lifecycleReceiveSchema,
};
