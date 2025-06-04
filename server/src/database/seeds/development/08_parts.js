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
      name: 'Retail Box Shell',
      code: 'BOX-SHELL',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Main structure of the box'
    },
    {
      name: 'Box Sleeve',
      code: 'BOX-SLEEVE',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Printed cardboard sleeve for outer branding'
    },
    {
      name: 'Box Tray',
      code: 'BOX-TRAY',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Internal insert to hold product in place'
    },
    {
      name: 'Box Lid',
      code: 'BOX-LID',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Top lid for telescoping box'
    },
    {
      name: 'Box Tray Insert',
      code: 'BOX-INSERT',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Cardboard tray insert used inside box'
    },
    {
      name: 'Box Bottom Base',
      code: 'BOX-BASE',
      type: 'box',
      unit_of_measure: 'piece',
      description: 'Bottom base of telescoping box'
    },
    {
      name: 'Telescoping Box',
      code: 'BOX-TEL',
      type: 'box',
      unit_of_measure: 'piece',
      description: '3-part telescoping box with lid, tray insert, and base as one assembled unit',
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
      description: 'Foam liner designed to fit threaded caps, providing a secure seal to prevent leakage and protect bottle contents.',
    },
    {
      name: 'Desiccant',
      code: 'DSC-PACKET',
      type: 'desiccant',
      unit_of_measure: 'packet',
      description: 'Silica gel packet used to absorb moisture inside packaging',
    },
    {
      name: 'Desiccant Cap Insert',
      code: 'INSERT-DESICCANT',
      type: 'insert',
      unit_of_measure: 'piece',
      description: 'Cap-mounted insert with integrated desiccant for moisture control in packaging',
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
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('parts')
    .insert(records)
    .onConflict('code')
    .ignore();
  
  console.log(`${records.length} parts seeded successfully.`);
};
