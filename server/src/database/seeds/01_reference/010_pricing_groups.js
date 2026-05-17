const { fetchDynamicValue } = require('../_helpers/utils');
const pricingData = require('../data/pricing-data');

/**
 * Derive country_code from SKU suffix.
 * Examples:
 * - CH-HN101-R-CA -> CA
 * - CH-HN100-R-CN -> CN
 * - WN-MO400-S-UN -> null (global/universal)
 *
 * @param {string} sku
 * @returns {string|null}
 */
const getCountryCodeFromSku = (sku) => {
  const suffix = sku?.split('-').pop();

  if (suffix === 'CA') return 'CA';
  if (suffix === 'CN') return 'CN';
  if (suffix === 'UN') return 'GLOBAL';

  return 'GLOBAL';
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  try {
    console.log('Seeding pricing_groups data...');

    const activeStatusId = await fetchDynamicValue(
      knex,
      'status',
      'name',
      'active',
      'id'
    );

    const systemUserId = await fetchDynamicValue(
      knex,
      'users',
      'email',
      'system@internal.local',
      'id'
    );

    const pricingTypes = await knex('pricing_types')
      .select('id', 'name')
      .whereIn('name', [
        'Wholesale',
        'Retail',
        'MSRP',
        'Friend and Family Price',
      ]);

    const getPricingTypeId = (name) =>
      pricingTypes.find((type) => type.name === name)?.id;

    const fixedTimestamp = new Date('2025-03-01T00:00:00Z');
    const groupMap = new Map();

    const addGroup = (sku, priceTypeName, price) => {
      if (price === null || price === undefined) return;

      const priceTypeId = getPricingTypeId(priceTypeName);
      if (!priceTypeId) {
        throw new Error(`Pricing type not found: ${priceTypeName}`);
      }

      const countryCode = getCountryCodeFromSku(sku);
      const normalizedPrice = Number(price).toFixed(2);

      const key = [
        priceTypeId,
        countryCode ?? 'GLOBAL',
        normalizedPrice,
        fixedTimestamp.toISOString(),
      ].join('|');

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: knex.raw('uuid_generate_v4()'),
          pricing_type_id: priceTypeId,
          country_code: countryCode,
          price: normalizedPrice,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
          updated_at: null,
        });
      }
    };

    for (const entry of pricingData) {
      addGroup(entry.sku, 'Wholesale', entry.wholesale);
      addGroup(entry.sku, 'MSRP', entry.msrp);
      addGroup(entry.sku, 'Retail', entry.retail);

      if (entry.friend_and_family !== null) {
        addGroup(entry.sku, 'Friend and Family Price', entry.friend_and_family);
      }
    }

    const rows = Array.from(groupMap.values());

    if (rows.length > 0) {
      await knex('pricing_groups')
        .insert(rows)
        .onConflict(['pricing_type_id', 'country_code', 'price', 'valid_from'])
        .ignore();
    }

    console.log(`${rows.length} pricing_groups records seeded successfully.`);
  } catch (err) {
    console.error('Failed to seed pricing_groups:', err.message);
    throw err;
  }
};
