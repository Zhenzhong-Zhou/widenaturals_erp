/**
 * @file payment-method-types.js
 * @description JSDoc type definitions for the payment method business domain.
 */

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PaymentMethodLookupAcl
 * @property {boolean} canViewAllStatuses
 * @property {boolean} canViewPaymentCode
 */
