/**
 * Shared validation rules for SKU code components.
 * Ensures consistency between:
 *  - Joi request validators
 *  - SKU generator validate() function
 */

const CODE_RULES = {
  BRAND: /^[A-Z]{2,5}$/,
  CATEGORY: /^[A-Z]{2,5}$/,
  VARIANT: /^[A-Z0-9]{1,10}$/,      // e.g., 120, MO400, TCM300
  REGION: /^[A-Z]{2,5}$/,          // e.g., CA, CN, UN
};

module.exports = {
  CODE_RULES,
};
