const {
  maskEmail,
  maskUUID,
  maskId,
  maskFull,
} = require('./mask-primitives');

/**
 * Domain-specific masking rules.
 *
 * Defines:
 * - which table
 * - which field
 * - which masking strategy
 */
const MASKING_RULES = {
  users: {
    email: maskEmail,
    user_id: maskUUID,
  },
  
  user_auth: {
    user_id: maskUUID,
    password_hash: maskFull,
  },
  
  orders: {
    order_id: maskId,
  },
};

module.exports = MASKING_RULES;
