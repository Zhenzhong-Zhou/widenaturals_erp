const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding compliance records for NPN...');
  
  // Fetch required IDs
  const [activeStatusId, systemUserId] = await Promise.all([
    fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);
  
  // Define smart compliance mapping: productName::sizeLabel::countryCode => complianceId
  const npnMap = {
    'Focus::60 Capsules::CA': '80102618',
    'Focus::60 Capsules::CN': '80102618',
    'Gut Health::60 Capsules::CA': '80102616',
    'Gut Health::60 Capsules::CN': '80102616',
    'Immune::60 Capsules::CA': '80109808',
    'Immune::60 Capsules::CN': '80109808',
    'Memory::60 Capsules::CA': '80119602',
    'Memory::60 Capsules::CN': '80119602',
    'Menopause::60 Capsules::CA': '80118579',
    'Menopause::60 Capsules::CN': '80121171',
    'Mood::60 Capsules::CA': '80122212',
    'Mood::60 Capsules::CN': '80124172',
    'Sleep::60 Capsules::CA': '80102452',
    'Sleep::60 Capsules::CN': '80102452',
    'Hair Health::60 Capsules::UN': '80121449',
    'Pain Relief Topical Stick::50 mg::CN': '80109751',
    'Pain Relief Topical Stick::50 mg::UN': '80109751',
    'NMN 3000::60 Capsules::CA': '80118770',
    'NMN 3000::60 Capsules::CN': '80123455',
    'NMN 6000::60 Capsules::CA': '80131669',
    'NMN 6000::60 Capsules::CN': '80123452',
    'NMN 10000::60 Capsules::CA': '80118522',
    'NMN 10000::60 Capsules::CN': '80123154',
    'NMN 15000::60 Capsules::CA': '80119337',
    'NMN 15000::60 Capsules::CN': '80123421',
    'NMN 30000::60 Capsules::CA': '80107082',
    'NMN 30000::60 Capsules::CN': '80122085',
    'Virility::60 Capsules::CA': '80111230',
    'Virility::60 Capsules::CN': '80121806',
    'Seal Oil Omega-3 500mg::180 Softgels::UN': '80131669',
    'Seal Oil Omega-3 500mg::120 Softgels::UN': '80131669',
    'EPA 900::60 Softgels::UN': '80118522',
    'EPA 900::120 Softgels::UN': '80118522',
    'Omega-3 900::60 Softgels::UN': '80119337',
    'Omega-3 900::120 Softgels::UN': '80119337',
    'Omega-3 + MultiVitamin Fish Oil::60 Softgels::UN': '80107082',
    'Omega-3 + MultiVitamin Fish Oil::120 Softgels::UN': '80107082',
    'Algal Oil Pure + DHA (Kids)::30 Softgels::UN': '80111230',
    'Algal Oil Pure + DHA (Kids)::60 Softgels::UN': '80111230',
    'DHA Algal Oil for Pregnancy and Breastfeeding::30 Softgels::UN': '80111182',
    'DHA Algal Oil for Pregnancy and Breastfeeding::60 Softgels::UN': '80111182',
  };
  
  // Join skus with products to get product name, size, country code
  const rows = await knex('skus as s')
    .join('products as p', 's.product_id', 'p.id')
    .select(
      's.id as sku_id',
      's.size_label',
      's.country_code',
      'p.name',
      's.sku'
    );
  
  const complianceRecords = [];
  
  for (const row of rows) {
    const key = `${row.name}::${row.size_label}::${row.country_code}`;
    const complianceId = npnMap[key];
    
    if (!complianceId) {
      console.warn(`No match for: ${key}`);
      continue;
    }
    
    complianceRecords.push({
      id: knex.raw('uuid_generate_v4()'),
      sku_id: row.sku_id,
      type: 'NPN',
      compliance_id: complianceId,
      issued_date: knex.fn.now(),
      expiry_date: null,
      description: `NPN for ${row.name} (${row.sku})`,
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemUserId,
      updated_by: null,
    });
  }
  
  if (!complianceRecords.length) {
    console.warn('No compliance records to insert.');
    return;
  }
  
  await knex('compliances')
    .insert(complianceRecords)
    .onConflict(['sku_id', 'type'])
    .ignore();
  
  console.log(`Inserted ${complianceRecords.length} NPN compliance records.`);
};
