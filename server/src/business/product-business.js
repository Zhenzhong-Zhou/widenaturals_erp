const { getStatusNameById, getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');

/**
 * Validates whether a product can transition from its current status
 * to a new target status, based on allowed transitions.
 *
 * ### Behavior
 * - Uses uppercase normalization for status names from cache.
 * - Returns `false` if either status ID is missing or unknown.
 *
 * ### Example
 * ```
 * validateProductStatusTransition('uuid-active', 'uuid-archived'); // true
 * validateProductStatusTransition('uuid-archived', 'uuid-active'); // false
 * ```
 *
 * @param {string} currentStatusId - UUID of the current product status
 * @param {string} newStatusId - UUID of the target product status
 * @returns {boolean} True if the transition is allowed, false otherwise
 */
const validateProductStatusTransition = (currentStatusId, newStatusId) => {
  const allowedTransitions = {
    PENDING: ['ACTIVE', 'INACTIVE'],
    ACTIVE: ['INACTIVE', 'DISCONTINUED', 'ARCHIVED'],
    INACTIVE: ['ACTIVE'],
    DISCONTINUED: ['ARCHIVED'],
    ARCHIVED: [],
  };
  
  const currentCode = getStatusNameById(currentStatusId);
  const nextCode = getStatusNameById(newStatusId);
  
  if (!currentCode || !nextCode) return false;
  
  const allowedNextStates = allowedTransitions[currentCode] ?? [];
  return allowedNextStates.includes(nextCode);
};

/**
 * Asserts that a product’s status transition is valid according to
 * business-defined transition rules.
 *
 * This function builds upon {@link validateProductStatusTransition},
 * but instead of returning `false`, it **throws** an AppError if the
 * transition is not permitted.
 *
 * ### Behavior
 * - Looks up both statuses from the in-memory cache.
 * - Throws if either status ID is unknown.
 * - Throws if the transition violates defined transition rules.
 *
 * ### Example
 * ```
 * assertValidProductStatusTransition(currentStatusId, nextStatusId);
 * // continues silently if allowed
 * // throws AppError.validationError if invalid
 * ```
 *
 * @param {string} currentStatusId - UUID of the current product status
 * @param {string} newStatusId - UUID of the target product status
 * @throws {AppError} If the transition is invalid or unknown
 */
const assertValidProductStatusTransition = (currentStatusId, newStatusId) => {
  const current = getStatusNameById(currentStatusId);
  const next = getStatusNameById(newStatusId);
  
  if (!current || !next) {
    throw AppError.validationError('Unknown status ID(s).', {
      currentStatusId,
      newStatusId,
    });
  }
  
  if (!validateProductStatusTransition(currentStatusId, newStatusId)) {
    throw AppError.validationError(`Invalid transition: ${current} → ${next}`);
  }
};

/**
 * Business Rule: Filter and Validate Updatable Product Fields
 *
 * Ensures only safe, business-allowed fields can be updated in product info
 * operations. Blocks modification of status or system-managed metadata fields.
 *
 * ### Behavior
 * - Accepts a raw update payload (usually from service layer).
 * - Rejects forbidden fields like `status_id` or audit columns.
 * - Returns a sanitized object containing only whitelisted fields.
 *
 * @param {Object} updates - Raw update payload (partial product data).
 * @returns {Object} Filtered update object ready for persistence.
 *
 * @throws {AppError.validationError}
 *   - If payload is invalid or empty.
 *   - If forbidden fields are included.
 */
const filterUpdatableProductFields = (updates = {}) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError('Invalid product update payload.');
  }
  
  // Explicitly allowed fields for editable product info
  const allowedFields = ['name', 'series', 'brand', 'category', 'description', 'updated_by', 'updated_at'];
  
  // Fields that must never be changed through this flow
  const forbiddenFields = ['status_id', 'status', 'created_by', 'created_at'];
  
  // Quick check for forbidden keys (fast path)
  for (const key of Object.keys(updates)) {
    if (forbiddenFields.includes(key)) {
      throw AppError.validationError(
        `Field "${key}" cannot be modified through this operation. ` +
        'Use the appropriate workflow (e.g., status update service).'
      );
    }
  }
  
  // Extract only allowed keys
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );
  
  if (Object.keys(filtered).length === 0) {
    throw AppError.validationError(
      'No valid editable product fields provided for update.'
    );
  }
  
  return filtered;
};

/**
 * @function
 * @description
 * Performs business-level validation on the incoming product list before
 * storage or normalization. This function enforces domain rules that are
 * not suitable for Joi schemas, such as:
 *
 *  - Ensuring at least one product is supplied.
 *  - Ensuring each product provides the minimum identity fields:
 *      * name
 *      * brand
 *      * category
 *
 * Joi validates structure and types at the request layer, while this function
 * validates domain logic that applies regardless of how the data enters the system.
 *
 * @param {Array<Object>} products - Array of raw product input objects.
 * @throws {AppError} If the product list is empty or missing required fields.
 */
const validateProductListBusiness = (products) => {
  const context = 'product-business/validateProductListBusiness';
  
  if (!Array.isArray(products) || products.length === 0) {
    throw AppError.validationError('No products provided for creation.', { context });
  }
  
  for (const p of products) {
    if (!p.name || !p.brand || !p.category) {
      throw AppError.validationError(
        'Each product must include name, brand, and category.',
        { context }
      );
    }
  }
};

/**
 * @function
 * @description
 * Normalizes and enriches raw product input objects to produce a clean,
 * database-ready insert payload. This includes:
 *
 *  - Trimming and uppercasing brand/category fields.
 *  - Normalizing optional fields such as series and description.
 *  - Applying default status (`general_inactive`).
 *  - Assigning audit fields (`created_by`, `updated_by`).
 *  - Ensuring `updated_by` remains NULL on insert, preserving audit integrity.
 *
 * This function ensures all products follow a consistent format before they
 * reach the repository layer and guarantees that database triggers and audit
 * fields behave predictably.
 *
 * @param {Array<Object>} products - Validated raw product objects.
 * @param {string} userId - The authenticated user creating these records.
 * @returns {Array<Object>} A normalized array ready for bulk insertion.
 */
const prepareProductInsertPayloads = (products, userId) => {
  const activeStatusId = getStatusId('general_inactive');
  
  return products.map((p) => ({
    name: p.name.trim(),
    series: p.series?.trim() ?? null,
    brand: p.brand.trim().toUpperCase(),
    category: p.category.trim().toUpperCase(),
    description: p.description ?? null,
    status_id: activeStatusId,
    created_by: userId,
    updated_by: null,   // IMPORTANT: per your repo rules — remains NULL on insert
  }));
};

module.exports = {
  validateProductStatusTransition,
  assertValidProductStatusTransition,
  filterUpdatableProductFields,
  validateProductListBusiness,
  prepareProductInsertPayloads,
};
