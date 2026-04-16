const { fetchDynamicValue } = require('../03_utils');

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

    const pricingData = [
      // Canaherb
      {
        sku: 'CH-HN100-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN101-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN102-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN103-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN104-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN105-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN106-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN107-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN108-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN109-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN110-R-CN',
        wholesale: 22.99,
        msrp: 48.99,
        friend_and_family: 35,
        retail: 48.99,
      },
      {
        sku: 'CH-HN111-R-CA',
        wholesale: 22.99,
        msrp: 48.99,
        friend_and_family: 35,
        retail: 48.99,
      },
      {
        sku: 'CH-HN112-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN113-R-CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN114-R-CN',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        sku: 'CH-HN115-R-UN',
        wholesale: 14.99,
        msrp: 29.99,
        friend_and_family: 20,
        retail: 29.99,
      },
      {
        sku: 'CH-HN116-R-UN',
        wholesale: 14.99,
        msrp: 35.99,
        friend_and_family: 25,
        retail: 35.99,
      },

      // PG
      {
        sku: 'PG-NM200-R-CN',
        wholesale: 58,
        msrp: 110,
        friend_and_family: 116,
        retail: 350,
      },
      {
        sku: 'PG-NM201-R-CA',
        wholesale: 58,
        msrp: 110,
        friend_and_family: 116,
        retail: 350,
      },
      {
        sku: 'PG-NM202-R-CN',
        wholesale: 75,
        msrp: 200,
        friend_and_family: 150,
        retail: 650,
      },
      {
        sku: 'PG-NM203-R-CA',
        wholesale: 75,
        msrp: 200,
        friend_and_family: 150,
        retail: 650,
      },
      {
        sku: 'PG-NM204-R-CN',
        wholesale: 98,
        msrp: 280,
        friend_and_family: 196,
        retail: 950,
      },
      {
        sku: 'PG-NM205-R-CA',
        wholesale: 98,
        msrp: 280,
        friend_and_family: 196,
        retail: 950,
      },
      {
        sku: 'PG-NM206-R-CN',
        wholesale: 125,
        msrp: 450,
        friend_and_family: 250,
        retail: 1480,
      },
      {
        sku: 'PG-NM207-R-CA',
        wholesale: 125,
        msrp: 450,
        friend_and_family: 250,
        retail: 1480,
      },
      {
        sku: 'PG-NM208-R-CN',
        wholesale: 184,
        msrp: 730,
        friend_and_family: 368,
        retail: 2400,
      },
      {
        sku: 'PG-NM209-R-CA',
        wholesale: 184,
        msrp: 730,
        friend_and_family: 368,
        retail: 2400,
      },
      {
        sku: 'PG-TCM300-R-CN',
        wholesale: 46,
        msrp: 180,
        friend_and_family: 92,
        retail: 600,
      },
      {
        sku: 'PG-TCM301-R-CA',
        wholesale: 46,
        msrp: 180,
        friend_and_family: 92,
        retail: 600,
      },

      // WIDE Naturals
      {
        sku: 'WN-MO400-S-UN',
        wholesale: 8.9,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
      {
        sku: 'WN-MO401-L-UN',
        wholesale: 10.9,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        sku: 'WN-MO402-S-UN',
        wholesale: 10.13,
        msrp: 25.99,
        friend_and_family: null,
        retail: 25.99,
      },
      {
        sku: 'WN-MO403-L-UN',
        wholesale: 17.82,
        msrp: 40.98,
        friend_and_family: null,
        retail: 40.98,
      },
      {
        sku: 'WN-MO404-S-UN',
        wholesale: 9.32,
        msrp: 24.99,
        friend_and_family: null,
        retail: 24.99,
      },
      {
        sku: 'WN-MO405-L-UN',
        wholesale: 16.2,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        sku: 'WN-MO406-S-UN',
        wholesale: 9.32,
        msrp: 24.99,
        friend_and_family: null,
        retail: 24.99,
      },
      {
        sku: 'WN-MO407-L-UN',
        wholesale: 16.2,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        sku: 'WN-MO408-S-UN',
        wholesale: 6.62,
        msrp: 19.99,
        friend_and_family: null,
        retail: 19.99,
      },
      {
        sku: 'WN-MO409-L-UN',
        wholesale: 11.61,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
      {
        sku: 'WN-MO410-S-UN',
        wholesale: 6.62,
        msrp: 19.99,
        friend_and_family: null,
        retail: 19.99,
      },
      {
        sku: 'WN-MO411-L-UN',
        wholesale: 11.61,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
    ];

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
