const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding part_materials...');

  const [systemUserId] = await Promise.all([
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);

  const now = knex.fn.now();

  const partMaterialLinks = [
    {
      partCode: 'PART-BOTTLE',
      materialCode: 'MAT-2PB005',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-BOTTLE',
      materialCode: 'MAT-9FG045',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-BOTTLE',
      materialCode: 'MAT-1FG046',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-BOTTLE',
      materialCode: 'MAT-AB-086',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-BOTTLE',
      materialCode: 'MAT-AB-087',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'PART-LID',
      materialCode: 'MAT-PFC001',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-LID',
      materialCode: 'MAT-SMP037',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-LID',
      materialCode: 'MAT-CMP038',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-LID',
      materialCode: 'MAT-SMP039',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-LID',
      materialCode: 'MAT-GMP040',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-LID',
      materialCode: 'MAT-ASC083',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFF007',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFF008',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFG009',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFG010',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFI011',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFI012',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM013',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM014',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM015',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM016',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM017',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFM018',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFS019',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFS020',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFH021',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN047',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN048',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN049',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN050',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN051',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN052',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN053',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN054',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN055',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFN056',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFV057',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFV058',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFV059',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFS088',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'LBL-STD',
      materialCode: 'MAT-LFS089',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFF022',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFF023',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFG024',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFG025',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFI026',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFI027',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM028',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM029',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM030',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM031',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM032',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFM033',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFS034',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFS035',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFH036',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFV082',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFN060',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-SHELL',
      materialCode: 'MAT-BFN061',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-TRAY',
      materialCode: 'MAT-TIF062',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF063',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF064',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF065',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF066',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF067',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF068',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-INSERT',
      materialCode: 'MAT-TIF069',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF070',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-INSERT',
      materialCode: 'MAT-TIF071',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF072',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF073',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-INSERT',
      materialCode: 'MAT-TIF074',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF075',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-LID',
      materialCode: 'MAT-BLF076',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-INSERT',
      materialCode: 'MAT-TIF077',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-BASE',
      materialCode: 'MAT-BBF078',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'BOX-TEL',
      materialCode: 'MAT-TBF079',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-TEL',
      materialCode: 'MAT-TBF080',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'BOX-TEL',
      materialCode: 'MAT-TBF081',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'INSERT-DESICCANT',
      materialCode: 'MAT-DPH041',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'INSERT-DESICCANT',
      materialCode: 'MAT-DPH042',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'PART-FILLER',
      materialCode: 'MAT-PWF004',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'PART-FILLER',
      materialCode: 'MAT-PWF044',
      quantity: 1,
      unit: 'pc',
    },

    {
      partCode: 'LINER-THREADED',
      materialCode: 'MAT-PTS084',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'DSC-PACKET',
      materialCode: 'MAT-SDP003',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'SEAL-TAMPER',
      materialCode: 'MAT-PSF006',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'CAP-VEG',
      materialCode: 'MAT-VC0002',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'CAP-VEG',
      materialCode: 'MAT-VC1043',
      quantity: 1,
      unit: 'pc',
    },
    {
      partCode: 'CAP-SOFTGEL',
      materialCode: 'MAT-SC5085',
      quantity: 1,
      unit: 'pc',
    },
  ];

  const records = [];

  for (const entry of partMaterialLinks) {
    const partId = await fetchDynamicValue(
      knex,
      'parts',
      'code',
      entry.partCode,
      'id'
    );
    const materialId = await fetchDynamicValue(
      knex,
      'packaging_materials',
      'code',
      entry.materialCode,
      'id'
    );

    if (!materialId) {
      console.error(`Material code not found: ${entry.materialCode}`);
      continue;
    }

    records.push({
      id: knex.raw('uuid_generate_v4()'),
      part_id: partId,
      packaging_material_id: materialId,
      quantity: entry.quantity,
      unit: entry.unit,
      created_at: now,
      updated_at: null,
      created_by: systemUserId,
      updated_by: null,
    });
  }

  if (records.length > 0) {
    await knex('part_materials')
      .insert(records)
      .onConflict(['part_id', 'packaging_material_id'])
      .ignore();

    console.log(`${records.length} part-material links seeded successfully.`);
  } else {
    console.warn('No valid records to insert into part_materials.');
  }

  await knex('part_materials')
    .insert(records)
    .onConflict(['part_id', 'packaging_material_id'])
    .ignore();

  console.log(`${records.length} part-material links seeded successfully.`);
};
