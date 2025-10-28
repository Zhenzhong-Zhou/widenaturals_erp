const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('Seeding bom_items (shared + custom)...');
  
  const createdBy = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const [boms, parts] = await Promise.all([
    knex('boms').select('id', 'code'),
    knex('parts').select('id', 'code'),
  ]);
  
  const bomMap = Object.fromEntries(boms.map((b) => [b.code, b.id]));
  const partMap = Object.fromEntries(parts.map((p) => [p.code, p.id]));
  
  const sharedSeries = {
    series1: [
      'BOM-CH-HN100-R-CN',
      'BOM-CH-HN101-R-CA',
      'BOM-CH-HN102-R-CN',
      'BOM-CH-HN103-R-CA',
      'BOM-CH-HN104-R-CN',
      'BOM-CH-HN105-R-CA',
      'BOM-CH-HN106-R-CN',
      'BOM-CH-HN107-R-CA',
      'BOM-CH-HN108-R-CN',
      'BOM-CH-HN109-R-CA',
      'BOM-CH-HN110-R-CN',
      'BOM-CH-HN111-R-CA',
      'BOM-CH-HN112-R-CN',
      'BOM-CH-HN113-R-CA',
      'BOM-CH-HN116-R-UN',
    ],
    series2: [
      'BOM-PG-NM200-R-CN',
      'BOM-PG-NM201-R-CA',
      'BOM-PG-NM202-R-CN',
      'BOM-PG-NM203-R-CA',
      'BOM-PG-NM204-R-CN',
      'BOM-PG-NM205-R-CA',
      'BOM-PG-NM206-R-CN',
      'BOM-PG-NM207-R-CA',
      'BOM-PG-NM208-R-CN',
      'BOM-PG-NM209-R-CA',
      'BOM-PG-TCM300-R-CN',
      'BOM-PG-TCM301-R-CA',
    ],
    series3: [
      'BOM-WN-MO400-S-UN',
      'BOM-WN-MO401-L-UN',
      'BOM-WN-MO402-S-UN',
      'BOM-WN-MO403-L-UN',
      'BOM-WN-MO404-S-UN',
      'BOM-WN-MO405-L-UN',
      'BOM-WN-MO406-S-UN',
      'BOM-WN-MO407-L-UN',
      'BOM-WN-MO408-S-UN',
      'BOM-WN-MO409-L-UN',
      'BOM-WN-MO410-S-UN',
      'BOM-WN-MO411-L-UN',
    ],
  };
  
  const seriesDefinitions = {
    series1: [
      {
        code: 'PART-LID',
        qty: 1,
        unit: 'pc',
        specifications: 'White plastic, food-grade, 38mm neck',
        note: 'Used for 250ml PET bottles',
      },
      {
        code: 'SEAL-TAMPER',
        qty: 1,
        unit: 'pc',
        specifications: 'White foam tamper seal, adhesive type',
        note: 'Standard tamper-evident seal for supplement bottles',
      },
      {
        code: 'DSC-PACKET',
        qty: 1,
        unit: 'pc',
        specifications: 'Desiccant plug, clear plastic, 1g silica',
        note: 'Inserted inside bottle before capping',
      },
      {
        code: 'CAP-VEG',
        qty: 60,
        unit: 'pcs',
        specifications: 'Transparent vegan capsule, size 0, HPMC material',
        note: 'Each bottle contains 60 filled capsules',
      },
      {
        code: 'PART-FILLER',
        qty: 1,
        unit: 'pc',
        specifications: 'Plastic filler insert, single layer',
        note: 'Prevents movement inside bottle',
      },
      {
        code: 'PART-BOTTLE',
        qty: 1,
        unit: 'pc',
        specifications: '250ml PET bottle, amber color, food-grade',
        note: 'Main container for capsule products',
      },
      {
        code: 'LBL-STD',
        qty: 1,
        unit: 'pc',
        specifications: 'Paper label, 19.6×7.0cm, matte finish',
        note: 'Standard bilingual label (EN/FR)',
      },
      {
        code: 'BOX-STD',
        qty: 1,
        unit: 'pc',
        specifications: 'Cardboard box, 6.4×6.4×11.3cm, natural brown',
        note: 'Outer packaging for retail display',
      },
    ],
    
    series2: [
      {
        code: 'PART-LID',
        qty: 1,
        unit: 'pc',
        specifications: 'Metallic plastic lid, silver finish, food-grade',
        note: 'Used for glass or frosted bottles',
      },
      {
        code: 'INSERT-DESICCANT',
        qty: 1,
        unit: 'pc',
        specifications: 'Plastic desiccant insert, clear, 0.5g',
        note: 'Alternative to desiccant packet, placed inside cap',
      },
      {
        code: 'DSC-PACKET',
        qty: 1,
        unit: 'pc',
        specifications: 'Green desiccant plug, 1g silica gel',
        note: 'Placed inside the bottle for moisture protection',
      },
      {
        code: 'CAP-VEG',
        qty: 60,
        unit: 'pcs',
        specifications: 'White vegan capsule, size 1, HPMC material',
        note: 'Each bottle contains 60 filled capsules',
      },
      {
        code: 'PART-FILLER',
        qty: 1,
        unit: 'pc',
        specifications: 'Plastic filler, transparent',
        note: 'For consistent packaging height',
      },
      {
        code: 'PART-BOTTLE',
        qty: 1,
        unit: 'pc',
        specifications: 'Frosted glass bottle, 250ml, 9K or 11K size',
        note: 'Premium packaging for export series',
      },
      {
        code: 'LBL-STD',
        qty: 1,
        unit: 'pc',
        specifications: 'Paper label, 13×4.5cm or 15.2×5.7cm, matte finish',
        note: 'Standard label for glass bottle variant',
      },
      {
        code: 'BOX-STD',
        qty: 1,
        unit: 'pc',
        specifications: 'Rigid outer box, cardboard, 6.5×6.5×12cm',
        note: 'For higher-end presentation series',
      },
    ],
    series3: [
      {
        code: 'PART-LID',
        qty: 1,
        unit: 'pc',
        specifications: 'Natural aluminum lid, brushed finish, food-grade',
        note: 'Screw-type aluminum lid matching 220ml bottle',
      },
      {
        code: 'LINER-THREADED',
        qty: 1,
        unit: 'pc',
        specifications: 'Plastic threaded liner, white, food-grade',
        note: 'Placed between lid and bottle neck',
      },
      {
        code: 'DSC-PACKET',
        qty: 1,
        unit: 'pc',
        specifications: 'Desiccant plug, plastic, 1g, food-grade',
        note: 'Standard for aluminum bottles',
      },
      {
        code: 'CAP-SOFTGEL',
        qty: 120,
        unit: 'pcs',
        specifications: 'Yellow gelatin softgel, 500mg fill weight, 00 size',
        note: 'Each bottle contains 120 softgels',
      },
      {
        code: 'PART-BOTTLE',
        qty: 1,
        unit: 'pc',
        specifications: '220ml aluminum bottle, brushed finish',
        note: 'Used for softgel product lines',
      },
      {
        code: 'LBL-STD',
        qty: 1,
        unit: 'pc',
        specifications: 'Plastic label, 16.0×6.5cm, waterproof adhesive',
        note: 'Standard label for aluminum bottle variant',
      },
    ],
  };
  
  // Currency pool for deterministic cycling
  const currencyPool = ['CAD', 'USD', 'CNY', 'HKD', 'EUR', 'JPY'];
  
  const getEstimatedCostByPartCode = (code) => {
    if (code.includes('LID')) return 0.25;
    if (code.includes('BOTTLE')) return 1.2;
    if (code.includes('BOX')) return 0.8;
    if (code.includes('LBL')) return 0.15;
    if (code.includes('CAP')) return 0.05;
    if (code.includes('LINER')) return 0.1;
    if (code.includes('DSC')) return 0.05;
    if (code.includes('FILLER')) return 0.2;
    return 0.1;
  };
  
  const generateBomItemRow = (bom_id, item, index) => {
    const currency = currencyPool[index % currencyPool.length];
    
    // Consistent currency → exchange rate mapping
    const exchangeRateMap = {
      CAD: 1.0,     // 1 CAD = 1 CAD
      USD: 0.73,    // 1 USD = 0.73 CAD
      EUR: 0.67,    // 1 EUR = 0.67 CAD
      CNY: 0.19,    // 1 CNY = 0.19 CAD
      HKD: 0.18,    // 1 HKD = 0.18 CAD
      JPY: 0.0089,  // 1 JPY = 0.0089 CAD
    };
    
    const exchange_rate = exchangeRateMap[currency] || 1.0;
    const baseCost = getEstimatedCostByPartCode(item.code);
    const estimated_unit_cost = Number((baseCost * exchange_rate).toFixed(4));
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      bom_id,
      part_id: partMap[item.code],
      part_qty_per_product: item.qty,
      unit: item.unit,
      specifications: item.specifications || null,
      note: item.note || null,
      estimated_unit_cost,
      currency,
      exchange_rate,
      created_by: createdBy,
      updated_by: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    };
  };
  
  const rows = [];
  let index = 0;
  
  for (const [series, bomCodes] of Object.entries(sharedSeries)) {
    const items = seriesDefinitions[series];
    if (!items) continue;
    
    for (const bomCode of bomCodes) {
      const bom_id = bomMap[bomCode];
      if (!bom_id) continue;
      
      for (const item of items) {
        if (!partMap[item.code]) continue;
        rows.push(generateBomItemRow(bom_id, item, index++));
      }
    }
  }
  
  if (rows.length > 0) {
    await knex('bom_items')
      .insert(rows)
      .onConflict(['bom_id', 'part_id'])
      .ignore();
    
    console.log(`Seeded ${rows.length} BOM item records with multi-currency cost and exchange rate.`);
  }

  // Optional currency summary
  const summary = rows.reduce((acc, r) => {
    acc[r.currency] = (acc[r.currency] || 0) + 1;
    return acc;
  }, {});
  console.table(summary);
};
