/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const brandCodeMap = {
    'Canaherb': 'CH',
    'Phyto-Genious': 'PG',
    'WIDE Naturals': 'WN',
  };
  
  const categoryCodeMap = {
    'Herbal Natural': 'HN',
    NMN: 'NM',
    TCM: 'TCM',
    'Marine Oil': 'MO',
  };
  
  const baseCombinations = [
    ['Canaherb', 'Herbal Natural'],
    ['Phyto-Genious', 'NMN'],
    ['Phyto-Genious', 'TCM'],
    ['WIDE Naturals', 'Marine Oil'],
  ];
  
  // Fetch dynamic values
  const [activeStatusId, systemUserId] = await Promise.all([
    knex('status').select('id').where('name', 'active').first(),
    knex('users').select('id').where('email', 'system@internal.local').first(),
  ]);
  
  const inserts = [];
  let baseCode = 100;
  
  for (const [brand, category] of baseCombinations) {
    inserts.push({
      id: knex.raw('uuid_generate_v4()'),
      brand_code: brandCodeMap[brand],
      category_code: categoryCodeMap[category],
      base_code: baseCode,
      status_id: activeStatusId.id,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemUserId.id,
      updated_by: null,
    });
    baseCode += 100;
  }
  
  await knex('sku_code_bases')
    .insert(inserts)
    .onConflict(['brand_code', 'category_code'])
    .ignore();
};
