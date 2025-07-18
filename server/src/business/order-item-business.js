const { getPriceByIdAndSku } = require('../repositories/pricing-repository');
const AppError = require('../utils/AppError');
const { resolveFinalPrice } = require('./pricing-business');

/**
 * Enriches order items with resolved (validated) price and calculated subtotal.
 *
 * For each item:
 * - Fetches the DB price by price_id and sku_id
 * - Resolves the final price using business rules (e.g., manual override or fallback)
 * - Calculates and attaches the subtotal (quantity * resolved price)
 *
 * @param {Array<object>} orderItems - List of order items (must include price_id, sku_id, price, quantity_ordered)
 * @param {object|null} client - Optional DB client for transaction context
 * @returns {Promise<{ enrichedItems: Array<object>, subtotal: number }>} - Enriched items ready for DB insert and overall subtotal
 *
 * @throws {AppError} - If price_id + sku_id is invalid or DB query fails
 */
const enrichOrderItemsWithResolvedPrice = async (orderItems, client) => {
  let subtotal = 0;
  const enrichedItems = [];

  for (const item of orderItems) {
    // Step 1: Get price record from DB
    const priceRecord = await getPriceByIdAndSku(
      item.price_id,
      item.sku_id,
      client
    );
    if (!priceRecord) {
      throw AppError.validationError(
        `Invalid price_id ${item.price_id} for sku_id ${item.sku_id}`
      );
    }

    const dbPrice = parseFloat(priceRecord.price);
    const submittedPrice = parseFloat(item.price);

    // Step 2: Resolve final price based on submitted and DB price, applying business rules
    const finalPrice = resolveFinalPrice(submittedPrice, dbPrice);

    // Step 3: Calculate subtotal (quantity * resolved price, no rounding here for precision)
    const itemSubtotal = item.quantity_ordered * finalPrice;
    subtotal += itemSubtotal;

    const metadata =
      finalPrice !== dbPrice
        ? {
            submitted_price: submittedPrice,
            db_price: dbPrice,
            reason: 'manual override',
          }
        : null;

    // Step 4: Build enriched item for DB insert
    enrichedItems.push({
      ...item,
      price: finalPrice, // Trusted resolved price (float)
      subtotal: itemSubtotal, // No rounding; keep precision for tax/total
      ...(metadata ? { metadata } : {}), // Meta only if override
    });
  }

  return { enrichedItems, subtotal };
};

module.exports = {
  enrichOrderItemsWithResolvedPrice,
};
