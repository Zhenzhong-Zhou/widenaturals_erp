const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  try {
    // Fetch dynamic IDs
    const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
    const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
    
    const priceTypeIds = await knex('pricing_types')
      .select('id', 'name')
      .whereIn('name', [
        'MSRP',
        'Product Cost',
        'Retail',
        'Friend and Family Price',
        'Discount Price',
      ]);
    
    const productIds = await knex('products').select('id');
    const locationIds = await knex('locations').select('id', 'name');
    
    if (!priceTypeIds.length || !productIds.length || !locationIds.length) {
      console.log('Ensure pricing_types, products, and locations are seeded first.');
      return;
    }
    
    const pricing = [];
    const staticPrices = [49.99, 99.99]; // Static prices
    const validFrom = '2025-01-01T00:00:00Z'; // Static valid_from timestamp
    
    for (const product of productIds) {
      for (const priceType of priceTypeIds) {
        for (const location of locationIds) {
          // Ensure only one active price for this combination
          const existingPrice = await knex('pricing')
            .where({
              product_id: product.id,
              price_type_id: priceType.id,
              location_id: location.id,
              valid_to: null, // Only active prices
            })
            .first();
          
          if (existingPrice) {
            // Expire the existing price
            await knex('pricing')
              .where('id', existingPrice.id)
              .update({
                valid_to: knex.fn.now(),
                updated_at: knex.fn.now(),
              });
          }
          
          // Add new price
          pricing.push({
            id: knex.raw('uuid_generate_v4()'),
            product_id: product.id,
            price_type_id: priceType.id,
            location_id: location.id,
            price: staticPrices[priceTypeIds.indexOf(priceType) % staticPrices.length],
            valid_from: validFrom,
            valid_to: null, // Active price
            status_id: activeStatusId,
            status_date: knex.fn.now(),
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
            created_by: adminUserId,
            updated_by: adminUserId,
          });
        }
      }
    }
    
    // Insert all prices
    await knex('pricing')
      .insert(pricing)
      .onConflict(['product_id', 'price_type_id', 'location_id', 'valid_from'])
      .ignore(); // Ignore duplicates
    
    console.log(`${pricing.length} pricing records seeded successfully.`);
  } catch (error) {
    console.error('Error seeding pricing data:', error.message);
  }
};
