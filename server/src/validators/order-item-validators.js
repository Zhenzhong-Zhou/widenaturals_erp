const Joi = require('joi');
const { validateOptionalUUID } = require('./general-validators');

/**
 * Joi schema for validating a **base order item** payload.
 *
 * Fields:
 * - `quantity_ordered` (number, required): Positive integer (>= 1).
 * - `price_id` (string, UUID | null, optional): Reference to a pricing record.
 * - `price` (number, optional, >= 0, nullable): Client-provided unit price **for display or drafts**.
 *    Not used for identity/deduping; server should resolve canonical price via `price_id`
 *    (or via an override mechanism if you support it).
 * - `metadata` (object, optional): Free-form JSON for extra per-line info.
 *
 * Notes:
 * - The schema uses `min(1)` (so `.positive()` is redundant but harmless).
 *
 * @type {Joi.ObjectSchema}
 */
const baseOrderItemSchema = Joi.object({
  quantity_ordered: Joi.number().integer().min(1).positive().required(),
  price_id: validateOptionalUUID('Price Id'),
  price: Joi.number().precision(2).min(0).optional().allow(null),
  metadata: Joi.object().optional(),
});

/**
 * Joi schema for validating a **sales order item** payload.
 *
 * Extends the base schema with sales-specific references:
 * - `sku_id` (string, UUID, optional)
 * - `packaging_material_id` (string, UUID, optional)
 *
 * Constraint:
 * - **Exactly one** of `sku_id` or `packaging_material_id` must be provided (`.xor(...)`).
 *
 * Notes:
 * - Business rules like "packaging-only orders are not allowed" are enforced
 *   in the sales-order business layer, not here.
 *
 * @type {Joi.ObjectSchema}
 */
const salesOrderItemSchema = baseOrderItemSchema
  .keys({
    sku_id: Joi.string().uuid().optional(),
    packaging_material_id: Joi.string().uuid().optional(),
  })
  .xor('sku_id', 'packaging_material_id');

module.exports = {
  salesOrderItemSchema,
};
