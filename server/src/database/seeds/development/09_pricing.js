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
    
    // Validate required data
    if (!priceTypeIds.length) {
      console.log('No pricing types found. Seed the pricing_types table first.');
      return;
    }
    
    if (!productIds.length) {
      console.log('No products found. Seed the products table first.');
      return;
    }
    
    if (!locationIds.length) {
      console.log('No locations found. Seed the locations table first.');
      return;
    }
    
    // Prepare pricing data
    const now = new Date();
    const validFrom = new Date(now);
    validFrom.setDate(validFrom.getDate() - 30); // Prices valid from 30 days ago
    
    const pricing = [];
    productIds.forEach((product, index) => {
      priceTypeIds.forEach((priceType) => {
        locationIds.forEach((location, locIndex) => {
          pricing.push({
            id: knex.raw('uuid_generate_v4()'),
            product_id: product.id,
            price_type_id: priceType.id,
            location_id: location.id, // Add location_id to the pricing data
            price: parseFloat(((index + 1) * 10 + (locIndex + 1) * 5 + Math.random() * 10).toFixed(2)), // Random prices
            valid_from: knex.fn.now(),
            valid_to: null, // No expiration by default
            status_id: activeStatusId,
            status_date: knex.fn.now(),
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
            created_by: adminUserId,
            updated_by: adminUserId,
          });
        });
      });
    });
    
    // Insert data with ON CONFLICT to avoid duplicates
    for (const price of pricing) {
      await knex('pricing')
        .insert(price)
        .onConflict(['product_id', 'price_type_id', 'location_id', 'valid_from']) // Ensure uniqueness for product, price type, location, and valid_from
        .ignore(); // Ignore duplicates
    }
    
    console.log(`${pricing.length} pricing records seeded successfully.`);
  } catch (error) {
    console.error('Error seeding pricing data:', error.message);
  }
};
