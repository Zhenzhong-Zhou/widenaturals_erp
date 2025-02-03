const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  try {
    console.log('Seeding pricing data...');
    
    // Fetch dynamic values
    const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
    const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
    
    // Fetch required IDs
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
    
    // More static price options without affecting price type logic
    const staticPrices = [
      49.99, 99.99, 19.99, 79.99, 129.99, 39.99, 59.99, 89.99, 109.99
    ];
    
    const validFrom = '2025-01-01T00:00:00Z'; // Static valid_from timestamp
    const pricing = [];
    
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
          
          // Assign a static price based on product ID to maintain consistency
          const priceIndex = productIds.indexOf(product) % staticPrices.length;
          const selectedPrice = staticPrices[priceIndex];
          
          // Add new price
          pricing.push({
            id: knex.raw('uuid_generate_v4()'),
            product_id: product.id,
            price_type_id: priceType.id,
            location_id: location.id,
            price: selectedPrice, // Assign different price from staticPrices array
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
      .ignore(); // Avoid duplicate entries
    
    console.log(`${pricing.length} pricing records seeded successfully.`);
  } catch (error) {
    console.error('Error seeding pricing data:', error.message);
  }
};
