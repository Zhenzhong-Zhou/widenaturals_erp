const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  try {
    console.log('Seeding pricing data...');
    
    const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
    const locationId = await fetchDynamicValue(knex, 'locations', 'name', 'Head Office Canada', 'id');
    const systemUserId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
    
    // Fetch pricing types
    const pricingTypes = await knex('pricing_types')
      .select('id', 'name')
      .whereIn('name', ['Wholesale', 'Retail', 'MSRP', 'Friend and Family Price']);
    
    const getPricingTypeId = (name) =>
      pricingTypes.find((type) => type.name === name)?.id;
    
    // Fetch SKU IDs
    const skuCodes = [
      'CH-HN100-R-CN', 'CH-HN101-R-CA', 'CH-HN102-R-CN', 'CH-HN103-R-CA', 'CH-HN104-R-CN',
      'CH-HN105-R-CA', 'CH-HN106-R-CN', 'CH-HN107-R-CA', 'CH-HN108-R-CN', 'CH-HN109-R-CA',
      'CH-HN110-R-CN', 'CH-HN111-R-CA', 'CH-HN112-R-CN', 'CH-HN113-R-CA', 'CH-HN114-R-CN',
      'CH-HN115-R-UN', 'CH-HN116-R-UN',
      
      'PG-NM200-R-CN', 'PG-NM201-R-CA', 'PG-NM202-R-CN', 'PG-NM203-R-CA', 'PG-NM204-R-CN',
      'PG-NM205-R-CA', 'PG-NM206-R-CN', 'PG-NM207-R-CA', 'PG-NM208-R-CN', 'PG-NM209-R-CA',
      'PG-TCM300-R-CN', 'PG-TCM301-R-CA',
      
      'WN-MO400-S-UN', 'WN-MO401-L-UN', 'WN-MO402-S-UN', 'WN-MO403-L-UN', 'WN-MO404-S-UN',
      'WN-MO405-L-UN', 'WN-MO406-S-UN', 'WN-MO407-L-UN', 'WN-MO408-S-UN', 'WN-MO409-L-UN',
      'WN-MO410-S-UN', 'WN-MO411-L-UN',
    ];
    
    const skus = await knex('skus').select('id', 'sku').whereIn('sku', skuCodes);
    const getSkuId = (code) => skus.find((s) => s.sku === code)?.id;
    
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
    
    for (const entry of pricingData) {
      const skuId = getSkuId(entry.sku);
      if (!skuId) {
        console.warn(`SKU not found: ${entry.sku}`);
        continue;
      }
      
      rows.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          sku_id: skuId,
          price_type_id: getPricingTypeId('Wholesale'),
          location_id: locationId,
          price: entry.wholesale,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          sku_id: skuId,
          price_type_id: getPricingTypeId('MSRP'),
          location_id: locationId,
          price: entry.msrp,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          sku_id: skuId,
          price_type_id: getPricingTypeId('Retail'),
          location_id: locationId,
          price: entry.retail,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        }
      );
      
      if (entry.friend_and_family !== null) {
        rows.push({
          id: knex.raw('uuid_generate_v4()'),
          sku_id: skuId,
          price_type_id: getPricingTypeId('Friend and Family Price'),
          location_id: locationId,
          price: entry.friend_and_family,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        });
      }
    }
    
    if (rows.length > 0) {
      await knex('pricing')
        .insert(rows)
        .onConflict(['sku_id', 'price_type_id', 'location_id', 'valid_from'])
        .ignore();
    }
    
    console.log(`${rows.length} pricing records seeded successfully.`);
  } catch (err) {
    console.error('Failed to seed pricing:', err.message);
    throw err;
  }
};
