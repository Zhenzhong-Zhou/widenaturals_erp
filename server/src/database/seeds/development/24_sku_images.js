const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { uploadSkuImageToS3 } = require('../../../utils/aws-s3-service');
const { loadEnv } = require('../../../config/env');
const { resizeImage } = require('../../../utils/image-utils');

loadEnv();

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  console.log('Seeding sku_images...');
  
  const isProd = process.env.NODE_ENV === 'production';
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  const skuRecords = await knex('skus').select('id', 'sku');
  const skuMap = Object.fromEntries(skuRecords.map(s => [s.sku, s.id]));
  
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
      sku: 'WN-MO400-S-UN',
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
      sku: 'WN-MO401-L-UN',
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
      sku: 'WN-MO402-S-UN',
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
      sku: 'WN-MO403-L-UN',
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
      sku: 'WN-MO404-S-UN',
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
      sku: 'WN-MO405-L-UN',
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
      sku: 'WN-MO406-S-UN',
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
      sku: 'WN-MO407-L-UN',
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
      sku: 'WN-MO408-S-UN',
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
      sku: 'WN-MO409-L-UN',
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
      sku: 'WN-MO410-S-UN',
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
      sku: 'WN-MO411-L-UN',
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
  ];
  
  const rows = [];
  
  for (const { sku, images } of seedData) {
    const skuId = skuMap[sku];
    if (!skuId) {
      console.warn(`SKU not found: ${sku}`);
      continue;
    }
    
    for (const img of images) {
      const isLocal = !img.url.startsWith('http');
      if (!isLocal) {
        console.warn(`Remote images not supported for resizing: ${img.url}`);
        continue;
      }
      
      const localPath = path.resolve(process.cwd(), img.url);
      if (!fs.existsSync(localPath)) {
        console.warn(`File not found: ${localPath}`);
        continue;
      }
      
      try {
        const baseName = path.basename(localPath, path.extname(localPath)); // e.g., focus_CA
        const brandFolder = sku.slice(0, 2);
        
        // Filenames
        const mainFileName = `${baseName}_main.webp`;
        const thumbFileName = `${baseName}_thumb.webp`;
        const zoomFileName = `${baseName}${path.extname(localPath)}`; // original
        
        // Temp resize folder
        const skuFolder = path.join('temp', sku);
        fs.mkdirSync(skuFolder, { recursive: true });
        
        const resizedMainPath = path.join(skuFolder, mainFileName);
        const resizedThumbPath = path.join(skuFolder, thumbFileName);
        
        await resizeImage(localPath, resizedMainPath, 800, 70, 5);
        await resizeImage(localPath, resizedThumbPath, 200, 60, 4);
        
        let s3MainUrl, s3ThumbUrl, s3ZoomUrl;
        
        if (isProd) {
          const keyPrefix = `sku-images/${brandFolder}`;
          s3MainUrl = await uploadSkuImageToS3(bucketName, resizedMainPath, keyPrefix, mainFileName);
          s3ThumbUrl = await uploadSkuImageToS3(bucketName, resizedThumbPath, keyPrefix, thumbFileName);
          s3ZoomUrl = await uploadSkuImageToS3(bucketName, localPath, keyPrefix, zoomFileName);
        } else {
          const devOutputDir = path.resolve(`public/uploads/sku-images/${brandFolder}`);
          fs.mkdirSync(devOutputDir, { recursive: true });
          
          const copiedMain = path.join(devOutputDir, mainFileName);
          const copiedThumb = path.join(devOutputDir, thumbFileName);
          const copiedZoom = path.join(devOutputDir, zoomFileName);
          
          fs.copyFileSync(resizedMainPath, copiedMain);
          fs.copyFileSync(resizedThumbPath, copiedThumb);
          fs.copyFileSync(localPath, copiedZoom);
          
          const publicBase = `/uploads/sku-images/${brandFolder}/${baseName}`;
          s3MainUrl = `${publicBase}_main.webp`;
          s3ThumbUrl = `${publicBase}_thumb.webp`;
          s3ZoomUrl = `${publicBase}${path.extname(localPath)}`;
        }
        
        const mainStats = fs.statSync(resizedMainPath);
        const thumbStats = fs.statSync(resizedThumbPath);
        const zoomStats = fs.statSync(localPath);
        const zoomMime = mime.lookup(localPath);
        const zoomFormat = mime.extension(zoomMime) || 'bin';
        
        rows.push(
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: s3MainUrl,
            image_type: 'main',
            display_order: 0,
            file_size_kb: Math.ceil(mainStats.size / 1024),
            file_format: 'webp',
            is_primary: true,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          },
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: s3ThumbUrl,
            image_type: 'thumbnail',
            display_order: 1,
            file_size_kb: Math.ceil(thumbStats.size / 1024),
            file_format: 'webp',
            is_primary: false,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          },
          {
            id: knex.raw('uuid_generate_v4()'),
            sku_id: skuId,
            image_url: s3ZoomUrl,
            image_type: 'zoom',
            display_order: 2,
            file_size_kb: Math.ceil(zoomStats.size / 1024),
            file_format: zoomFormat,
            is_primary: false,
            alt_text: img.alt,
            uploaded_at: knex.fn.now(),
            uploaded_by: systemUser.id,
          }
        );
        
        console.log(`Processed SKU ${sku} — main, thumbnail, zoom`);
      } catch (err) {
        console.error(`Failed to process ${img.url}:`, err.message);
      }
    }
  }
  
  if (rows.length) {
    await knex('sku_images')
      .insert(rows)
      .onConflict(['sku_id', 'image_url'])
      .ignore();
    console.log(`Inserted ${rows.length} sku_images`);
  } else {
    console.warn('No sku_images to insert.');
  }
  
  // Cleanup temp folder
  const tempPath = path.resolve('temp');
  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    console.log('Cleaned up temp folder');
  }
};
