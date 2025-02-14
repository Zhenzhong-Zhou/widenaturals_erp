const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  const adminUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'admin@example.com',
    'id'
  );

  const productIds = await knex('products').select('id', 'product_name');
  if (!productIds.length) {
    console.log('No products found. Seed the products table first.');
    return;
  }

  const complianceTypes = ['FDA', 'CE', 'ISO', 'RoHS', 'EcoCert', 'NPN'];
  const compliances = productIds.slice(0, 20).map((product, index) => ({
    id: knex.raw('uuid_generate_v4()'),
    product_id: product.id,
    type: complianceTypes[index % complianceTypes.length],
    compliance_id: `COM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    issued_date: knex.fn.now(),
    expiry_date: index % 2 === 0 ? knex.fn.now() : null,
    description: `Compliance details for ${product.product_name}`,
    status_id: activeStatusId,
    status_date: knex.fn.now(),
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
    created_by: adminUserId,
    updated_by: adminUserId,
  }));

  const batchSize = 10; // Insert in batches
  try {
    for (let i = 0; i < compliances.length; i += batchSize) {
      const batch = compliances.slice(i, i + batchSize);
      await knex('compliances')
        .insert(batch)
        .onConflict(['product_id', 'type'])
        .ignore();
    }
    console.log(
      `${compliances.length} compliance records seeded successfully.`
    );
  } catch (error) {
    console.error('Error seeding compliances:', error.message);
  }
};
