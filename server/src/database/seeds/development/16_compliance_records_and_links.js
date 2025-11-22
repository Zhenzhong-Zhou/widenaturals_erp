const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding compliance_records + sku_compliance_links for NPN...');

  // ------------------------------------------------------------------
  // 0. Early exit if both compliance documents and links already exist
  // ------------------------------------------------------------------
  const hasComplianceDocs = await knex('compliance_records')
    .where({ type: 'NPN' })
    .count('id as count')
    .first();
  
  const hasLinks = await knex('sku_compliance_links')
    .count('id as count')
    .first();
  
  if (Number(hasComplianceDocs.count) > 0 && Number(hasLinks.count) > 0) {
    console.log('NPN compliance_records + sku_compliance_links already seeded. Skipping.');
    return;
  }
  
  // Fetch required IDs
  const [activeStatusId, systemUserId] = await Promise.all([
    fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);
  
  //
  // --------------------------------------------------------
  // 1. Mapping: productName::sizeLabel::countryCode → NPN ID
  // --------------------------------------------------------
  //
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
    'Pain Relief Topical Stick::50g::CN': '80109751',
    'Pain Relief Topical Stick::50g::UN': '80109751',
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
  
  //
  // --------------------------------------------------------
  // 2. Fetch SKUs + product metadata for mapping
  // --------------------------------------------------------
  //
  const rows = await knex('skus as s')
    .join('products as p', 's.product_id', 'p.id')
    .select(
      's.id as sku_id',
      's.size_label',
      's.country_code',
      'p.name',
      's.sku'
    );
  
  //
  // --------------------------------------------------------
  // 3. Insert compliance_records (DOCUMENTS)
  // --------------------------------------------------------
  //
  const uniqueComplianceIds = [...new Set(Object.values(npnMap))];
  
  const complianceRecords = await knex('compliance_records')
    .insert(
      uniqueComplianceIds.map((npn) => ({
        id: knex.raw('uuid_generate_v4()'),
        type: 'NPN',
        compliance_id: npn,
        issued_date: knex.fn.now(),
        expiry_date: null,
        description: `NPN compliance document ${npn}`,
        status_id: activeStatusId,
        created_by: systemUserId,
        updated_at: null,
        updated_by: null,
      }))
    )
    .onConflict(['type', 'compliance_id'])
    .merge()
    .returning(['id', 'compliance_id']);
  
  //
  // --------------------------------------------------------
  // 4. Build lookup: compliance_id → record UUID
  // --------------------------------------------------------
  //
  const complianceRecordIdMap = {};
  for (const rec of complianceRecords) {
    complianceRecordIdMap[rec.compliance_id] = rec.id;
  }
  
  //
  // --------------------------------------------------------
  // 5. Prepare sku_compliance_links
  // --------------------------------------------------------
  //
  const linkRows = [];
  
  for (const row of rows) {
    const key = `${row.name}::${row.size_label}::${row.country_code}`;
    const complianceId = npnMap[key];
    
    if (!complianceId) continue;
    
    linkRows.push({
      id: knex.raw('uuid_generate_v4()'),
      sku_id: row.sku_id,
      compliance_record_id: complianceRecordIdMap[complianceId],
      created_at: knex.fn.now(),
      created_by: systemUserId,
    });
  }
  
  //
  // --------------------------------------------------------
  // 6. Insert sku_compliance_links (idempotent)
  // --------------------------------------------------------
  //
  await knex('sku_compliance_links')
    .insert(linkRows)
    .onConflict(['sku_id', 'compliance_record_id'])
    .ignore();
  
  console.log(
    `Inserted ${complianceRecords.length} compliance records and ${linkRows.length} sku compliance links.`
  );
};
