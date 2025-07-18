const { fetchDynamicValue } = require('../03_utils');
const { generateSKU } = require('../../../utils/sku-generator');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  // Check if 'products' or 'skus' already have data
  const existingProducts = await knex('products').count('id as count').first();
  const existingSkus = await knex('skus').count('id as count').first();

  if (
    parseInt(existingProducts.count, 10) > 0 ||
    parseInt(existingSkus.count, 10) > 0
  ) {
    console.warn('Seeding skipped: products or skus already populated.');
    return;
  }

  const [
    activeStatusId,
    inActiveStatusId,
    discontinuedStatusId,
    systemActionId,
  ] = await Promise.all([
    fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    fetchDynamicValue(knex, 'status', 'name', 'inactive', 'id'),
    fetchDynamicValue(knex, 'status', 'name', 'discontinued', 'id'),
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);

  const productDefs = [
    {
      name: 'Focus',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description:
        'Improve Mental Performance. 改善大脑功能，提升精神集中和精神耐力。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007071',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253062',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Gut Health',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description: 'Treats Digestive Upset. 有效改善消化功能，刺激食欲。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007088',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253055',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Immune',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description: 'Maintains a Healthy Immune System. 提升自然免疫系统。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007101',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253017',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Memory',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description:
        'Support Memory & Cognitive Health. 改善记忆、认知健康、大脑功能。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007057',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253031',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Menopause',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description: 'Relieves Symptoms of Menopause. 缓解更年期相关症状。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007095',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253048',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Mood',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description: 'Promotes Healthy Mood Balance. 有助于维持健康稳定的情绪。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007064',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942370670',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Sleep',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description: 'Sleep Aid, Calmative. 提升睡眠质量，缓解紧张情绪。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007040',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253000',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Pain Relief Topical Stick',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description:
        'Instantly relieves pain. 超浓缩、快速吸收，舒缓肌肉酸痛等各类疼痛。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628942007125',
          market_region: 'China',
          size_label: '50g',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: discontinuedStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'R',
          barcode: '628693253086',
          market_region: 'Universe',
          size_label: '50g',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Hair Health',
      brand: 'Canaherb',
      series: 'Canaherb',
      category: 'Herbal Natural',
      description:
        'Helps to Maintain Healthy Hair. 恢复靓丽秀发 保持发肤健康。',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'R',
          barcode: '628942370663',
          market_region: 'Universe',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'NMN 3000',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'NMN',
      description: 'Stay At Your Peak. 成年入门养生之选。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '627987829587',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942007132',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'NMN 6000',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'NMN',
      description: 'Stay At Your Peak. 成年独居慧眼之选。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '627987829556',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942370724',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'NMN 10000',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'NMN',
      description: 'Stay At Your Peak. 中年远见卓识之选。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '627987829600',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942370656',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'NMN 15000',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'NMN',
      description: 'Stay At Your Peak. 中年至强精英之选。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '627987829570',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942370687',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'NMN 30000',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'NMN',
      description: 'Stay At Your Peak. 中来年至臻尊荣之选。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '764460916607',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628693253994',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Virility',
      brand: 'Phyto-Genious',
      series: 'Phyto-Genious',
      category: 'TCM',
      description: 'Traditional Chinese Medicine. 巅峰男士必备臻品。',
      variants: [
        {
          regionCode: 'CN',
          language: 'en-fr',
          country_code: 'CN',
          variantCode: 'R',
          barcode: '628693253079',
          market_region: 'China',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'CA',
          language: 'en-fr',
          country_code: 'CA',
          variantCode: 'R',
          barcode: '628942007118',
          market_region: 'Canada',
          size_label: '60 Capsules',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'Seal Oil Omega-3 500mg',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description: 'Premium Seal Oil supplement for overall health support.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628942370694',
          market_region: 'Universe',
          size_label: '120 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628942370700',
          size_label: '180 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: activeStatusId,
        },
      ],
    },
    {
      name: 'EPA 900',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description:
        'High-concentration EPA 900 supplement for cardiovascular health.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628719706008',
          market_region: 'Universe',
          size_label: '60 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628942370748',
          size_label: '120 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
      ],
    },
    {
      name: 'Omega-3 900',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description: 'Omega-3 900mg softgels for brain and heart health.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628942370731',
          market_region: 'Universe',
          size_label: '60 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628942370717',
          size_label: '120 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
      ],
    },
    {
      name: 'Omega-3 + MultiVitamin Fish Oil',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description: 'Multivitamin-enriched fish oil for daily health support.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628719706060',
          market_region: 'Universe',
          size_label: '60 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628719706053',
          size_label: '120 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
      ],
    },
    {
      name: 'Algal Oil Pure + DHA (Kids)',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description:
        'Algal Oil specially formulated for kids’ brain and eye health.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628719706022',
          market_region: 'Universe',
          size_label: '30 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628719706015',
          size_label: '60 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
      ],
    },
    {
      name: 'DHA Algal Oil for Pregnancy and Breastfeeding',
      brand: 'WIDE Naturals',
      series: 'WIDE Collection',
      category: 'Marine Oil',
      description:
        'Algal Oil DHA supplement for pregnant women and fetal development.',
      variants: [
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'S',
          barcode: '628719706046',
          market_region: 'Universe',
          size_label: '30 Softgels',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
        {
          regionCode: 'UN',
          language: 'en-fr',
          country_code: 'UN',
          variantCode: 'L',
          barcode: '628719706039',
          size_label: '60 Softgels',
          market_region: 'Universe',
          dimensions: {
            length_cm: 15,
            width_cm: 10,
            height_cm: 5,
            weight_g: 250,
          },
          status_id: inActiveStatusId,
        },
      ],
    },
  ];

  const brandNameToCode = {
    Canaherb: 'CH',
    'Phyto-Genious': 'PG',
    'WIDE Naturals': 'WN',
  };

  const categoryNameToCode = {
    'Herbal Natural': 'HN',
    NMN: 'NM',
    TCM: 'TCM',
    'Marine Oil': 'MO',
  };

  let insertedCount = 0;

  for (const productDef of productDefs) {
    const productColumns = ['name', 'brand', 'series', 'category'];

    const insertData = {
      id: knex.raw('uuid_generate_v4()'),
      name: productDef.name,
      brand: productDef.brand,
      series: productDef.series,
      category: productDef.category,
      description: productDef.description,
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
      updated_at: null,
    };

    // Insert or ignore if duplicate
    await knex('products')
      .insert(insertData)
      .onConflict(productColumns)
      .ignore();

    // Get the product ID (whether inserted or already existed)
    const [{ id: productId }] = await knex('products').select('id').where({
      name: productDef.name,
      brand: productDef.brand,
      series: productDef.series,
      category: productDef.category,
    });

    const lastUsedCodeMap = new Map();

    for (const variant of productDef.variants) {
      const brandCode = brandNameToCode[productDef.brand];
      const categoryCode = categoryNameToCode[productDef.category];

      const sku = await generateSKU(
        brandCode,
        categoryCode,
        variant.variantCode,
        variant.regionCode || null,
        lastUsedCodeMap
      );

      if (variant.barcode) {
        const existing = await knex('skus')
          .where({ barcode: variant.barcode })
          .first();
        if (existing) {
          console.warn(`Duplicate barcode skipped: ${variant.barcode}`);
          continue;
        }
      }

      await knex('skus')
        .insert({
          id: knex.raw('uuid_generate_v4()'),
          product_id: productId,
          sku,
          barcode: variant.barcode,
          language: variant.language,
          country_code: variant.country_code,
          market_region: variant.market_region,
          size_label: variant.size_label,
          description: productDef.description,
          ...variant.dimensions,
          status_id: variant.status_id,
          created_by: systemActionId,
          updated_by: null,
          updated_at: null,
        })
        .onConflict(['product_id', 'sku'])
        .ignore();

      insertedCount++;
    }
  }

  console.log(`${insertedCount} SKUs inserted.`);
};
