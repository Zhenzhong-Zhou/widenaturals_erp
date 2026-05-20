const mime = require('mime-types');
const { v5: uuidv5 } = require('uuid');
const { loadEnv } = require('../../../config/env');
const {
  logSystemInfo,
  logSystemException,
} = require('../../../utils/logging/system-logger');
const { processImageFile } = require('../../../utils/media/sku-image-media');
const { resolveSource } = require('../../../utils/media/image-source');

loadEnv();

// Stable namespace for deterministic group_id generation.
// Generate once, never change — changing it would cause re-runs to mint
// fresh group_ids and stop being idempotent.
const SKU_IMAGE_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  console.log('Seeding sku_images...');

  const isProd = process.env.NODE_ENV === 'production';
  const bucketName = process.env.AWS_S3_IMAGES_BUCKET;

  const skuRecords = await knex('skus').select('id', 'sku');
  const skuMap = Object.fromEntries(skuRecords.map((s) => [s.sku, s.id]));

  const systemUser = await knex('users')
    .where({ email: 'system@internal.local' })
    .first();
  if (!systemUser) throw new Error('System user not found');

  const seedData = [
    {
      sku: 'CH-HN100-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/focus_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Focus China version',
        },
      ],
    },
    {
      sku: 'CH-HN101-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/focus_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Focus Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN102-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/gut_health_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Gut Health China version',
        },
      ],
    },
    {
      sku: 'CH-HN103-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/gut_health_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Gut Health Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN104-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/immune_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Immune China version',
        },
      ],
    },
    {
      sku: 'CH-HN105-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/immune_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Immune Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN106-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/memory_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Memory China version',
        },
      ],
    },
    {
      sku: 'CH-HN107-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/memory_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Memory Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN108-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/menopause_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Menopause China version',
        },
      ],
    },
    {
      sku: 'CH-HN109-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/menopause_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Menopause Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN110-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/mood_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Mood China version',
        },
      ],
    },
    {
      sku: 'CH-HN111-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/mood_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Mood Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN112-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/sleep_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Sleep China version',
        },
      ],
    },
    {
      sku: 'CH-HN113-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/sleep_CA.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Sleep Canada version',
        },
      ],
    },
    {
      sku: 'CH-HN114-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/pain_relief_CN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Pain Relief Topical Stick China version',
        },
      ],
    },
    {
      sku: 'CH-HN115-R-UN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/pain_relief_UN.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Pain Relief Topical Stick Universal version',
        },
      ],
    },
    {
      sku: 'CH-HN116-R-UN',
      images: [
        {
          url: 'src/assets/sku-images/Canaherb/hair_health.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Hair Health Universal version',
        },
      ],
    },
    {
      sku: 'PG-NM200-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_3000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 3000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-NM201-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_3000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 3000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-NM202-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_6000_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 6000 China version',
        },
      ],
    },
    {
      sku: 'PG-NM203-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_6000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 6000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-NM204-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_10000_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 10000 China version',
        },
      ],
    },
    {
      sku: 'PG-NM205-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_10000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 10000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-NM206-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_15000_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 15000 China version',
        },
      ],
    },
    {
      sku: 'PG-NM207-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_15000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 15000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-NM208-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_30000_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 30000 China version',
        },
      ],
    },
    {
      sku: 'PG-NM209-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/nmn_30000_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of NMN 30000 Canada version',
        },
      ],
    },
    {
      sku: 'PG-TCM300-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/virility_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Virility China version',
        },
      ],
    },
    {
      sku: 'PG-TCM301-R-CA',
      images: [
        {
          url: 'src/assets/sku-images/PG/virility_ca.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Virility Canada version',
        },
      ],
    },
    {
      sku: 'WN-MO800-S-UN', // was WN-MO400-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/seal_oil_omega3_500mg_120.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Seal Oil Omega 3 500mg 120 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO801-L-UN', // was WN-MO401-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/seal_oil_omega3_500mg_180.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Seal Oil Omega-3 500mg 180 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO802-S-UN', // was WN-MO402-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/epa_900_60.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of EPA 900 60 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO803-L-UN', // was WN-MO403-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/epa_900_120.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of EPA 900 120 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO804-S-UN', // was WN-MO404-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/omega3_900_60.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Omega-3 900 60 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO805-L-UN', // was WN-MO405-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/omega3_900_120.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Omega-3 900 120 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO806-S-UN', // was WN-MO406-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/omega3_multivitamin_fish_oil_60.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Omega-3 + MultiVitamin Fish Oil 60 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO807-L-UN', // was WN-MO407-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/omega3_multivitamin_fish_oil_120.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Omega-3 + MultiVitamin Fish Oil 120 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO808-S-UN', // was WN-MO408-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/algal_oil_pure_dha_kids_30.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Algal Oil Pure + DHA Kids 30 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO809-L-UN', // was WN-MO409-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/algal_oil_pure_dha_kids_60.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Algal Oil Pure + DHA Kids 60 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO810-S-UN', // was WN-MO410-S-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/dha_algal_oil_pregnancy_breastfeeding_30.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of DHA Algal Oil for Pregnancy and Breastfeeding 30 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-MO811-L-UN', // was WN-MO411-L-UN
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/dha_algal_oil_pregnancy_breastfeeding_60.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of DHA Algal Oil for Pregnancy and Breastfeeding 60 Softgels version',
        },
      ],
    },
    
    // --- Phyto-Genious (PG) new products ---
    {
      sku: 'PG-MO400-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/seal_oil_plus_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Seal Oil Plus China version',
        },
      ],
    },
    {
      sku: 'PG-AO500-S-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/astaxanthin_plus_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Astaxanthin Plus China version',
        },
      ],
    },
    {
      sku: 'PG-CL600-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/cell_revive_cn.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Cell Revive China version',
        },
      ],
    },
    {
      sku: 'PG-HH700-R-CN',
      images: [
        {
          url: 'src/assets/sku-images/PG/ubiquinol_100mg_coq10_mega_cn.jpg',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of Ubiquinol 100mg CoQ10 Mega China version',
        },
      ],
    },
    
    // --- WIDE Naturals (WN) new products ---
    {
      sku: 'WN-MO812-S-UN',
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/new_seal_oil_omega3_120.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of New Seal Oil Omega-3 120 Softgels version',
        },
      ],
    },
    {
      sku: 'WN-BH900-S-UN',
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/5_in_1_d3_k2_ca_mg_zn.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of 5 IN 1 D3 + K2 + Ca + Mg + Zn version',
        },
      ],
    },
    {
      sku: 'WN-HH1000-S-UN',
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/coq10_pqq_seal_oil.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of CoQ10 + PQQ Seal Oil version',
        },
      ],
    },
    {
      sku: 'WN-GH1100-R-UN',
      images: [
        {
          url: 'src/assets/sku-images/WIDE_Collections/akk_dag_oil.png',
          type: 'main',
          order: 0,
          isPrimary: true,
          alt: 'Front view of AKK + DAG Oil version',
        },
      ],
    },
  ];
  
  // Preserve user-uploaded primary images: skip any SKU that already has one.
  // Seed will only run for SKUs that have never had a primary set.
  const existingPrimaries = await knex('sku_images')
    .where({ is_primary: true })
    .select('sku_id');
  const skusWithPrimary = new Set(existingPrimaries.map((r) => r.sku_id));
  
  const rows = [];
  
  for (const { sku, images } of seedData) {
    const skuId = skuMap[sku];
    if (!skuId) {
      console.warn(`SKU not found: ${sku}`);
      continue;
    }
    
    if (skusWithPrimary.has(skuId)) {
      console.log(
        `Skipping ${sku} — already has a primary image (likely user-uploaded)`
      );
      continue;
    }
    
    const groupId = uuidv5(`sku-images:${sku}`, SKU_IMAGE_NAMESPACE);
    
    for (const [imgIndex, img] of images.entries()) {
      if (img.url.startsWith('http')) {
        console.warn(`Remote images not supported in seed: ${img.url}`);
        continue;
      }
      
      try {
        // resolveSource handles local-path read + existence check.
        // Returns { buffer, mimetype, originalname }.
        const file = await resolveSource(img.url, sku);
        
        const {
          mainKey, thumbKey, zoomKey,
          mainSizeKb, thumbSizeKb, zoomSizeKb,
          ext,
        } = await processImageFile(file, sku, isProd, bucketName);
        
        const zoomFormat = mime.extension(file.mimetype) || ext || 'bin';
        const baseOrder = imgIndex * 3;
        
        rows.push(
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: mainKey,
            image_type: 'main',
            display_order: baseOrder,
            file_size_kb: mainSizeKb,
            file_format: 'webp',
            is_primary: img.isPrimary === true && imgIndex === 0,
            group_id: groupId,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          },
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: thumbKey,
            image_type: 'thumbnail',
            display_order: baseOrder + 1,
            file_size_kb: thumbSizeKb,
            file_format: 'webp',
            is_primary: false,
            group_id: groupId,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          },
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: zoomKey,
            image_type: 'zoom',
            display_order: baseOrder + 2,
            file_size_kb: zoomSizeKb,
            file_format: zoomFormat,
            is_primary: false,
            group_id: groupId,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          }
        );
        
        logSystemInfo('Processed SKU images', {
          context: 'seed-sku-images',
          sku,
          keys: [mainKey, thumbKey, zoomKey],
        });
      } catch (err) {
        logSystemException(err, 'Failed to process SKU image', {
          context: 'seed-sku-images',
          sku,
          url: img.url,
        });
      }
    }
  }
  
  if (rows.length) {
    await knex('sku_images')
      .insert(rows)
      .onConflict(['sku_id', 'group_id', 'image_type'])
      .ignore();
    
    console.log(`Inserted ${rows.length} sku_images (existing rows ignored)`);
  } else {
    console.log('No new sku_images to insert.');
  }
};
