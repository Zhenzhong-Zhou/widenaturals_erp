const { fetchDynamicValue } = require('../03_utils');
const pricingData = require('../data/pricing-data');

/**
 * Derive country_code from SKU suffix.
 * - ...-CA => 'CA'
 * - ...-CN => 'CN'
 * - ...-UN => 'GLOBAL'
 *
 * @param {string} sku
 * @returns {string}
 */
const getCountryCodeFromSku = (sku) => {
  const suffix = sku?.split('-').pop();

  if (suffix === 'CA') return 'CA';
  if (suffix === 'CN') return 'CN';
  if (suffix === 'UN') return 'GLOBAL';

  return 'GLOBAL';
};

exports.seed = async function (knex) {
  try {
    console.log('Seeding pricing data...');

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

    const pricingTypeMap = new Map(
      pricingTypes.map((row) => [row.name, row.id])
    );

    const skuRows = await knex('skus').select('id', 'sku');
    const skuMap = new Map(skuRows.map((row) => [row.sku, row.id]));

    const pricingGroupRows = await knex('pricing_groups').select(
      'id',
      'pricing_type_id',
      'country_code',
      'price',
      'valid_from'
    );

    const pricingGroupMap = new Map();

    for (const row of pricingGroupRows) {
      const key = [
        row.pricing_type_id,
        row.country_code,
        Number(row.price).toFixed(2),
        new Date(row.valid_from).toISOString(),
      ].join('|');

      pricingGroupMap.set(key, row.id);
    }
    
    const fixedTimestamp = new Date('2025-03-01T00:00:00Z');
    const rows = [];

    const addPricingLink = (sku, priceTypeName, price) => {
      if (price === null || price === undefined) return;

      const skuId = skuMap.get(sku);
      if (!skuId) {
        throw new Error(`SKU not found: ${sku}`);
      }

      const priceTypeId = pricingTypeMap.get(priceTypeName);
      if (!priceTypeId) {
        throw new Error(`Pricing type not found: ${priceTypeName}`);
      }

      const countryCode = getCountryCodeFromSku(sku);
      const normalizedPrice = Number(price).toFixed(2);

      const pricingGroupKey = [
        priceTypeId,
        countryCode,
        normalizedPrice,
        fixedTimestamp.toISOString(),
      ].join('|');

      const pricingGroupId = pricingGroupMap.get(pricingGroupKey);
      if (!pricingGroupId) {
        throw new Error(
          `Pricing group not found for SKU ${sku}, type ${priceTypeName}, country ${countryCode}, price ${normalizedPrice}`
        );
      }

      rows.push({
        pricing_group_id: pricingGroupId,
        sku_id: skuId,
        created_by: systemUserId,
      });
    };

    for (const entry of pricingData) {
      addPricingLink(entry.sku, 'Wholesale', entry.wholesale);
      addPricingLink(entry.sku, 'MSRP', entry.msrp);
      addPricingLink(entry.sku, 'Retail', entry.retail);

      if (entry.friend_and_family !== null) {
        addPricingLink(
          entry.sku,
          'Friend and Family Price',
          entry.friend_and_family
        );
      }
    }

    if (rows.length > 0) {
      await knex('pricing')
        .insert(rows)
        .onConflict(['pricing_group_id', 'sku_id'])
        .ignore();
    }

    console.log(`${rows.length} pricing records seeded successfully.`);
  } catch (err) {
    console.error('Failed to seed pricing:', err.message);
    throw err;
  }
};
