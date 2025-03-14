const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  try {
    console.log('Seeding tax rates data...');

    const systemActionId = await fetchDynamicValue(
      knex,
      'users',
      'email',
      'system@internal.local',
      'id'
    );

    // 🔹 Fixed valid_from timestamp to prevent duplicate conflicts
    const fixedTimestamp = new Date('2025-03-01T00:00:00Z');

    // ✅ Insert common tax rates in Canada
    const taxRates = [
      { name: 'GST', rate: 5.0, province: null, region: 'Canada' },
      { name: 'PST', rate: 7.0, province: 'BC', region: 'Canada' },
      { name: 'PST', rate: 6.0, province: 'SK', region: 'Canada' },
      { name: 'PST', rate: 7.0, province: 'MB', region: 'Canada' },
      { name: 'QST', rate: 9.975, province: 'QC', region: 'Canada' },
      { name: 'HST', rate: 13.0, province: 'ON', region: 'Canada' },
      { name: 'HST', rate: 15.0, province: 'NB', region: 'Canada' },
      { name: 'HST', rate: 15.0, province: 'NS', region: 'Canada' },
      { name: 'HST', rate: 15.0, province: 'NL', region: 'Canada' },
      { name: 'HST', rate: 15.0, province: 'PE', region: 'Canada' },
      { name: 'Zero-Rated', rate: 0.0, province: null, region: 'Canada' },
    ];

    // ✅ Format data for insertion
    const formattedTaxRates = taxRates.map((tax) => ({
      id: knex.raw('uuid_generate_v4()'),
      name: tax.name,
      rate: tax.rate,
      region: tax.region,
      province: tax.province,
      is_active: true,
      valid_from: fixedTimestamp,
      valid_to: null,
      created_by: systemActionId,
      updated_by: null,
    }));

    // ✅ Insert tax rates & prevent duplicates
    await knex('tax_rates')
      .insert(formattedTaxRates)
      .onConflict(['name', 'province', 'region', 'valid_from'])
      .ignore(); // Avoid duplicate tax rates

    console.log(
      `${formattedTaxRates.length} tax_rate records seeded successfully.`
    );
  } catch (error) {
    console.error('Error seeding tax rates:', error.message);
    throw error; // Re-throw for visibility
  }
};
