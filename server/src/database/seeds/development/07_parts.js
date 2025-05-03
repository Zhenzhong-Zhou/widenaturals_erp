const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding parts...');
  
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const now = knex.fn.now();
  
  const parts = [
    {
      name: 'Capsule',
      code: 'CAP-VEG',
      type: 'capsule',
      unit_of_measure: 'piece',
      description: 'Clear vegetable-based capsule for encapsulating powder or softgel',
    },
    {
      name: 'Softgel Capsule',
      code: 'CAP-SOFTGEL',
      type: 'softgel',
      unit_of_measure: 'piece',
      description: 'Pre-filled gelatin-based softgel capsule containing active ingredients, ready for bottling',
    },
    {
      name: 'Printed Label',
      code: 'LBL-STD',
      type: 'label',
      unit_of_measure: 'roll',
      description: 'Generic printed adhesive label for product packaging',
    },
    {
      name: 'Retail Box',
      code: 'BOX-STD',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Cardboard box used for retail product presentation or shipping',
    },
    {
      name: 'Tamper-Evident Seal',
      code: 'SEAL-TAMPER',
      type: 'seal',
      unit_of_measure: 'piece',
      description: 'Foil-based seal that indicates if the product has been opened',
    },
    {
      name: 'Threaded Sealing Liner',
      code: 'LINER-THREADED',
      type: 'liner',
      unit_of_measure: 'piece',
      description: 'Foam liner inserted inside cap to improve seal and prevent leakage',
    },
    {
      name: 'Desiccant',
      code: 'DSC-PACKET',
      type: 'desiccant',
      unit_of_measure: 'packet',
      description: 'Silica gel packet used to absorb moisture inside packaging',
    },
    {
      name: 'Desiccant Cap Liner',
      code: 'LINER-DESICCANT',
      type: 'liner',
      unit_of_measure: 'piece',
      description: 'Cap liner integrated with desiccant for moisture control',
    },
    {
      name: 'Filler',
      code: 'PART-FILLER',
      type: 'filler',
      unit_of_measure: 'piece',
      description: 'Generic filler material used to stabilize or protect contents during packaging',
    },
    {
      name: 'Bottle',
      code: 'PART-BOTTLE',
      type: 'container',
      unit_of_measure: 'piece',
      description: 'Generic container used to hold product in solid or liquid form',
    },
    {
      name: 'Lid',
      code: 'PART-LID',
      type: 'lid',
      unit_of_measure: 'piece',
      description: 'Generic lid or cap used to seal a container',
    }
  ];
  
  const records = parts.map((part) => ({
    id: knex.raw('uuid_generate_v4()'),
    ...part,
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('parts')
    .insert(records)
    .onConflict('code')
    .ignore();
  
  console.log(`${records.length} parts seeded successfully.`);
};
