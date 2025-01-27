/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  try {
    // Fetch dynamic IDs
    const activeStatusId = await knex('status')
      .select('id')
      .where('name', 'active')
      .first()
      .then((row) => row?.id);
    
    const adminUserId = await knex('users')
      .select('id')
      .where('email', 'admin@example.com')
      .first()
      .then((row) => row?.id);
    
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
    
    // Validate required data
    if (!priceTypeIds.length) {
      console.log('No pricing types found. Seed the pricing_types table first.');
      return;
    }
    
    if (!productIds.length) {
      console.log('No products found. Seed the products table first.');
      return;
    }
    
    // Prepare pricing data
    const now = new Date();
    const validFrom = new Date(now);
    validFrom.setDate(validFrom.getDate() - 30); // Prices valid from 30 days ago
    
    const pricing = [];
    productIds.forEach((product, index) => {
      priceTypeIds.forEach((priceType) => {
        pricing.push({
          id: knex.raw('uuid_generate_v4()'),
          product_id: product.id,
          price_type_id: priceType.id,
          price: parseFloat(((index + 1) * 10 + Math.random() * 10).toFixed(2)), // Random prices
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
    
    // Insert data with ON CONFLICT to avoid duplicates
    for (const price of pricing) {
      await knex('pricing')
        .insert(price)
        .onConflict(['product_id', 'price_type_id']) // Ensure uniqueness for product and price type
        .ignore(); // Ignore duplicates
    }
    
    console.log(`${pricing.length} pricing records seeded successfully.`);
  } catch (error) {
    console.error('Error seeding pricing data:', error.message);
  }
};
