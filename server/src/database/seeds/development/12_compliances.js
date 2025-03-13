const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding compliance records for NPN...');

  // Fetch required IDs
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  // Define product name to NPN mapping (International)
  const npnMapping = {
    // International (INT)
    'NMN 3000 - INT': '80123455',
    'NMN 6000 - INT': '80123452',
    'NMN 10000 - INT': '80123154',
    'NMN 15000 - INT': '80123421',
    'NMN 30000 - INT': '80122085',
    'Virility - INT': '80121806',
    'Sleep - INT': '80102452',
    'Immune - INT': '80109808',
    'Memory - INT': '80119602',
    'Menopause - INT': '80121171',
    'Mood - INT': '80124172',
    'Gut Health - INT': '80102616',
    'Focus - INT': '80102618',
    'Pain Relief - INT': '80109751',
    'Hair Health - INT': '80121449',

    // Canada (CA)
    'NMN 3000 - CA': '80118770',
    'NMN 6000 - CA': '80131669',
    'NMN 10000 - CA': '80118522',
    'NMN 15000 - CA': '80119337',
    'NMN 30000 - CA': '80107082',
    'Virility - CA': '80111230',
    'Sleep - CA': '80102452',
    'Immune - CA': '80109808',
    'Memory - CA': '80119602',
    'Menopause - CA': '80118579',
    'Gut Health - CA': '80102616',
    'Focus - CA': '80102618',
    'Pain Relief Topical Stick': '80109751',
    'Mood - CA': '80122212',
    'Hair Health': '80121449',

    // New Oil & Supplement Products with Size Variations
    'Seal Oil - 180 Softgels': '80131669',
    'Seal Oil - 120 Softgels': '80131669',
    'EPA 900 - 120 Softgels': '80118522',
    'EPA 900 - 60 Softgels': '80118522',
    'Omega-3 900 - 120 Softgels': '80119337',
    'Omega-3 900 - 60 Softgels': '80119337',
    'MultiVitamin Fish Oil - 120 Softgels': '80107082',
    'MultiVitamin Fish Oil - 60 Softgels': '80107082',
    'Algal Oil Kids - 60 Softgels': '80111230',
    'Algal Oil Kids - 30 Softgels': '80111230',
    'Algal Oil Pregnant - 60 Softgels': '80111182',
    'Algal Oil Pregnant - 30 Softgels': '80111182',
  };

  // Fetch product IDs for products in the mapping
  const products = await knex('products')
    .whereIn('product_name', Object.keys(npnMapping))
    .select('id', 'product_name');

  if (products.length === 0) {
    console.warn(
      'No matching products found. Skipping NPN compliance seeding.'
    );
    return;
  }

  // Map product names to their IDs
  const productIdMap = products.reduce((acc, product) => {
    acc[product.product_name] = product.id;
    return acc;
  }, {});

  // Generate compliance records with matching `product_id` and `compliance_id`
  const complianceRecords = products.map((product) => ({
    id: knex.raw('uuid_generate_v4()'),
    product_id: productIdMap[product.product_name], // Correct product ID
    type: 'NPN',
    compliance_id: npnMapping[product.product_name], // Correct NPN
    issued_date: knex.fn.now(),
    expiry_date: null, // Can be adjusted if needed
    description: `Natural Product Number for ${product.product_name}`,
    status_id: activeStatusId,
    status_date: knex.fn.now(),
    created_at: knex.fn.now(),
    updated_at: null,
    created_by: systemActionId,
    updated_by: null,
  }));

  try {
    await knex('compliances')
      .insert(complianceRecords)
      .onConflict(['product_id', 'type']) // Prevent duplicates
      .ignore();

    console.log(
      `✅ ${complianceRecords.length} NPN compliance records seeded successfully.`
    );
  } catch (error) {
    console.error('❌ Error seeding NPN compliances:', error.message);
  }
};
