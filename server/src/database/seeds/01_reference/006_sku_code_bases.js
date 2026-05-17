/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const brandCodeMap = {
    Canaherb: 'CH',
    'Phyto-Genious': 'PG',
    'WIDE Naturals': 'WN',
  };
  
  const categoryCodeMap = {
    'Herbal Natural': 'HN',
    NMN: 'NM',
    TCM: 'TCM',
    'Marine Oil': 'MO',
    Antioxidant: 'AO',
    'Cellular Health': 'CL',
    'Heart Health': 'HH',
    'Bone Health': 'BH',
    'Gut Health': 'GH',
  };
  
  const baseCombinations = [
    ['Canaherb', 'Herbal Natural'],
    ['Phyto-Genious', 'NMN'],
    ['Phyto-Genious', 'TCM'],
    ['Phyto-Genious', 'Marine Oil'],   // ← new (Seal Oil Plus)
    ['Phyto-Genious', 'Antioxidant'],  // ← new (Astaxanthin Plus)
    ['Phyto-Genious', 'Cellular Health'], // ← new (Cell Revive)
    ['Phyto-Genious', 'Heart Health'], // ← new (Ubiquinol)
    ['WIDE Naturals', 'Marine Oil'],
    ['WIDE Naturals', 'Bone Health'],  // ← new (5 IN 1)
    ['WIDE Naturals', 'Heart Health'], // ← new (CoQ10 + PQQ Seal Oil)
    ['WIDE Naturals', 'Gut Health'],   // ← new (AKK + DAG Oil)
  ];
  
  // --- Verify stop: catch config errors before hitting the DB ---
  for (const [brand, category] of baseCombinations) {
    if (!brandCodeMap[brand]) {
      throw new Error(`sku_code_bases seed: missing brandCodeMap entry for "${brand}"`);
    }
    if (!categoryCodeMap[category]) {
      throw new Error(`sku_code_bases seed: missing categoryCodeMap entry for "${category}"`);
    }
  }
  const seenCombos = new Set();
  for (const [brand, category] of baseCombinations) {
    const key = `${brand}|${category}`;
    if (seenCombos.has(key)) {
      throw new Error(`sku_code_bases seed: duplicate combination "${brand} × ${category}"`);
    }
    seenCombos.add(key);
  }
  
  // Fetch dynamic values
  const [activeStatusId, systemUserId] = await Promise.all([
    knex('status').select('id').where('name', 'active').first(),
    knex('users').select('id').where('email', 'system@internal.local').first(),
  ]);
  
  if (!activeStatusId) {
    throw new Error('sku_code_bases seed: status "active" not found — run status seed first');
  }
  if (!systemUserId) {
    throw new Error('sku_code_bases seed: user "system@internal.local" not found — run users seed first');
  }
  // --- end verify stop ---
  
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
