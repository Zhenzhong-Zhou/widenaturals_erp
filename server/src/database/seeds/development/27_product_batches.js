const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding batches...');
  
  const activeStatusId = await fetchDynamicValue(knex, 'batch_status', 'name', 'active', 'id');
  const suspendedStatusId = await fetchDynamicValue(knex, 'batch_status', 'name', 'suspended', 'id');
  const systemActionId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  
  // Load manufacturers
  const manufacturers = await knex('manufacturers').select('id', 'name');
  const manufacturerMap = {
    'Phyto-Matrix Natural Technologies': manufacturers.find(m => m.name.includes('Phyto-Matrix'))?.id,
    'Novastown Health': manufacturers.find(m => m.name.includes('Novastown'))?.id,
    'Canadian Phytopharmaceuticals': manufacturers.find(m => m.name.includes('Canadian Phytopharmaceuticals'))?.id,
  };
  
  // Lot data (standardized format)
  const lotData = [
    {
      product_name: 'Focus',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11000001',
      expiry_date: '2026MAR07',
      quantity: 2,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Focus',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11000004',
      expiry_date: '2026FEB13',
      quantity: 82,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Focus',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11000001',
      expiry_date: '2026MAR07',
      quantity: 8,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Focus',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11000002',
      expiry_date: '2025AUG24',
      quantity: 6,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Gut Health',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11100004',
      expiry_date: '2026JAN20',
      quantity: 24,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Gut Health',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11100005',
      expiry_date: '2026AUG11',
      quantity: 12,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Gut Health',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11100001',
      expiry_date: '2026MAR07',
      quantity: 4,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Hair Health',
      size_label: '60 Capsules',
      country_code: 'UN',
      lot_number: 'NTFS2E003',
      expiry_date: '2027-11-20',
      quantity: 1950,
      manufacturer: 'Novastown Health',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11300001',
      expiry_date: '2026MAR07',
      quantity: 10,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11300003',
      expiry_date: '2026FEB14',
      quantity: 16,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11300004',
      expiry_date: '2026APR05',
      quantity: 141,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: 'CM78737',
      expiry_date: '2027AUG25',
      quantity: 97,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11300001',
      expiry_date: '2025AUG25',
      quantity: 1,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11300002',
      expiry_date: '2025DEC21',
      quantity: 2,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11300004',
      expiry_date: '2026APR05',
      quantity: 8,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Immune',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: 'CM78737',
      expiry_date: '2027AUG25',
      quantity: 149,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11400001?',
      expiry_date: '2026MAR07',
      quantity: 10,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11400001',
      expiry_date: '2025AUG10',
      quantity: 12,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11400003',
      expiry_date: '2026JAN24',
      quantity: 31,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11400004',
      expiry_date: '2026AUG10',
      quantity: 144,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11400001',
      expiry_date: '2026MAR07',
      quantity: 12,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11400003',
      expiry_date: '2026JAN25',
      quantity: 39,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11400004',
      expiry_date: '2026AUG10',
      quantity: 140,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Memory',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: 'CM79739',
      expiry_date: '2027SEP02',
      quantity: 30,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    {
      product_name: 'Menopause',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11500001',
      expiry_date: '2026MAR07',
      quantity: 10,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Menopause',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11500002',
      expiry_date: '2026JUL05',
      quantity: 149,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Menopause',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11800001',
      expiry_date: '2025OCT20',
      quantity: 8,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Menopause',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11800003',
      expiry_date: '2026FEB16',
      quantity: 7,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Menopause',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: 'CM80742',
      expiry_date: '2027SEP05',
      quantity: 21,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    {
      product_name: 'Mood',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12800001?',
      expiry_date: '2026MAR20',
      quantity: 4,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Mood',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12800001',
      expiry_date: '2026MAR20',
      quantity: 67,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Mood',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11900001',
      expiry_date: '2026MAR20',
      quantity: 3,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Mood',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '11900004',
      expiry_date: '2026AUG03',
      quantity: 71,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Sleep',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11200003',
      expiry_date: '2026MAY10',
      quantity: 6,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Sleep',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '11200004',
      expiry_date: '2026JUL11',
      quantity: 53,
      status_id: suspendedStatusId,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'Sleep',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: 'CS86736',
      expiry_date: '2027AUG11',
      quantity: 16,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    
    {
      product_name: 'NMN 3000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12000004',
      expiry_date: '2026APR24',
      quantity: 91,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 3000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12000004',
      expiry_date: '2026APR24',
      quantity: 11,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 3000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12000005',
      expiry_date: '2026JUL20',
      quantity: 148,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 6000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12100003',
      expiry_date: '2025NOV23',
      quantity: 18,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 6000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12100004',
      expiry_date: '2025APR18',
      quantity: 96,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 6000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12100004',
      expiry_date: '2026APR18',
      quantity: 33,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 6000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12100005',
      expiry_date: '2026JUL18',
      quantity: 144,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 10000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12200005',
      expiry_date: '2026MAR07',
      quantity: 1,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 10000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12200008',
      expiry_date: '2027MAR05',
      quantity: 88,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 15000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12300012',
      expiry_date: '2027FEB13',
      quantity: 14,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 15000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12300013',
      expiry_date: '2027MAY15',
      quantity: 32,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 15000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: '12300014',
      expiry_date: '2027AUG19',
      quantity: 200,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 30000',
      size_label: '60 Capsules',
      country_code: 'CA',
      lot_number: '12400007',
      expiry_date: '2026MAR02',
      quantity: 3,
      manufacturer: 'Phyto-Matrix Natural Technologies',
    },
    {
      product_name: 'NMN 30000',
      size_label: '60 Capsules',
      country_code: 'CN',
      lot_number: 'VNN7E68C',
      expiry_date: '2027SEP18',
      quantity: 388,
      manufacturer: 'Canadian Phytopharmaceuticals',
    },
    
    {
      product_name: 'Seal Oil Omega-3 500mg',
      size_label: '120 Softgels',
      country_code: 'UN',
      lot_number: 'NTSS2E002',
      expiry_date: '2027-10-20',
      quantity: 22,
      manufacturer: 'Novastown Health',
    },
    {
      product_name: 'Seal Oil Omega-3 500mg',
      size_label: '180 Softgels',
      country_code: 'UN',
      lot_number: 'NTSS2E001',
      expiry_date: '2027-10-20',
      quantity: 0,
      manufacturer: 'Novastown Health',
    },
  ];
  
  const parseDate = (str) => {
    const d = new Date(str);
    return isNaN(d) ? null : d.toISOString().split('T')[0];
  };
  
  const getSkuId = async (knex, name, size, country) => {
    const row = await knex('skus')
      .join('products', 'skus.product_id', 'products.id')
      .select('skus.id')
      .where('products.name', name)
      .andWhere('skus.size_label', size)
      .andWhere('skus.country_code', country)
      .first();
    
    return row?.id || null;
  };
  
  const batches = [];
  
  for (const entry of lotData) {
    const skuId = await getSkuId(knex, entry.product_name, entry.size_label, entry.country_code);
    const manufacturerId = manufacturerMap[entry.manufacturer];
    const expiry = parseDate(entry.expiry_date);
    
    if (!skuId) {
      console.warn(`SKU not found for ${entry.product_name} | ${entry.size_label} | ${entry.country_code}`);
      continue;
    }
    if (!manufacturerId) {
      console.warn(`Skipping batch: Unknown manufacturer "${entry.manufacturer}"`);
      continue;
    }
    if (!expiry) {
      console.warn(`Skipping batch: Invalid expiry date "${entry.expiry_date}"`);
      continue;
    }
    
    const manufactureDate = new Date(expiry);
    manufactureDate.setFullYear(manufactureDate.getFullYear() - 3);
    
    batches.push({
      id: knex.raw('uuid_generate_v4()'),
      lot_number: entry.lot_number,
      sku_id: skuId,
      manufacturer_id: manufacturerId,
      manufacture_date: manufactureDate.toISOString().split('T')[0],
      expiry_date: expiry,
      received_date: null,
      initial_quantity: entry.quantity,
      notes: null,
      status_id: entry.status_id || activeStatusId,
      status_date: knex.fn.now(),
      released_at: knex.fn.now(),
      released_by: null,
      released_by_manufacturer_id: null,
      created_at: knex.fn.now(),
      created_by: systemActionId,
      updated_at: null,
      updated_by: null,
    });
  }
  
  console.log(`Prepared ${batches.length} valid batches out of ${lotData.length} total entries`);
  
  if (batches.length > 0) {
    await knex('product_batches')
      .insert(batches)
      .onConflict(['lot_number', 'sku_id'])
      .ignore();
    console.log(`Seeded ${batches.length} product batches.`);
  } else {
    console.log('No valid batch entries to seed.');
  }
};
