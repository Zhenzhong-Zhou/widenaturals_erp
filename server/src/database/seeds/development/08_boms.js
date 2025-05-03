const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding BOMs...');
  
  const activeUserId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const systemUserId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  
  const skus = await knex('skus').select('id', 'sku'); // Assuming sku column stores the SKU code
  const skuMap = Object.fromEntries(skus.map(({ id, sku }) => [sku, id]));
  
  const now = knex.fn.now();
  
  // Extracted from your provided SKU data
  const skuCodes = [
    'CH-HN100-R-CN', 'CH-HN101-R-CA', 'CH-HN102-R-CN', 'CH-HN103-R-CA',
    'CH-HN104-R-CN', 'CH-HN105-R-CA', 'CH-HN106-R-CN', 'CH-HN107-R-CA',
    'CH-HN108-R-CN', 'CH-HN109-R-CA', 'CH-HN110-R-CN', 'CH-HN111-R-CA',
    'CH-HN112-R-CN', 'CH-HN113-R-CA', 'CH-HN114-R-CN', 'CH-HN115-R-UN',
    'CH-HN116-R-UN', 'PG-NM200-R-CN', 'PG-NM201-R-CA', 'PG-NM202-R-CN',
    'PG-NM203-R-CA', 'PG-NM204-R-CN', 'PG-NM205-R-CA', 'PG-NM206-R-CN',
    'PG-NM207-R-CA', 'PG-NM208-R-CN', 'PG-NM209-R-CA', 'PG-TCM300-R-CN',
    'PG-TCM300-R-CA', 'WN-MO400-S-UN', 'WN-MO401-L-UN', 'WN-MO402-S-UN',
    'WN-MO403-L-UN', 'WN-MO404-S-UN', 'WN-MO405-L-UN', 'WN-MO406-S-UN',
    'WN-MO407-L-UN', 'WN-MO408-S-UN', 'WN-MO409-L-UN', 'WN-MO410-S-UN',
    'WN-MO411-L-UN'
  ];
  
  const boms = skuCodes
    .map((skuCode) => {
      const skuId = skuMap[skuCode];
      if (!skuId) {
        console.warn(`SKU not found: ${skuCode}`);
        return null;
      }
      
      return {
        id: knex.raw('uuid_generate_v4()'),
        sku_id: skuId,
        code: `BOM-${skuCode}`,
        name: `${skuCode} – Production BOM`,
        description: `Default BOM structure for SKU ${skuCode}`,
        is_active: true,
        is_default: true,
        revision: 1,
        status_id: activeUserId,
        status_date: now,
        created_at: now,
        updated_at: now,
        created_by: systemUserId,
        updated_by: null,
      };
    })
    .filter(Boolean);
  
  if (boms.length) {
    await knex('boms')
      .insert(boms)
      .onConflict('code')
      .ignore();
    
    console.log(`Seeded ${boms.length} BOMs.`);
  } else {
    console.log('No BOMs seeded.');
  }
};
