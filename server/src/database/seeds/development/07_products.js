/**
 * @param { import("knex").Knex } knex
 * @param {string} tableName - The table to fetch data from.
 * @param {string} columnName - The column to match the value.
 * @param {string} value - The value to match.
 * @param {string} returnColumn - The column to return.
 * @returns {Promise<any>} - The value of the return column.
 */
async function fetchDynamicValue(knex, tableName, columnName, value, returnColumn) {
  const result = await knex(tableName).select(returnColumn).where(columnName, value).first();
  return result ? result[returnColumn] : null;
}

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const pendingStatusId = await fetchDynamicValue(knex, 'status', 'name', 'pending', 'id');
  const inactiveStatusId = await fetchDynamicValue(knex, 'status', 'name', 'inactive', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  const products = [
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Eco-Friendly Water Bottle',
      series: 'Hydration Plus',
      brand: 'EcoLife',
      category: 'Drinkware',
      SKU: 'ECO-WTR-001',
      barcode: '1234567890123',
      market_region: 'North America',
      length_cm: 25.00,
      width_cm: 8.00,
      height_cm: 8.00,
      weight_g: 500.00,
      description: 'A reusable water bottle made from BPA-free materials, perfect for daily hydration.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Organic Cotton Tote Bag',
      series: 'Nature Carry',
      brand: 'EcoLife',
      category: 'Accessories',
      SKU: 'ECO-BAG-002',
      barcode: '1234567890456',
      market_region: 'Europe',
      length_cm: 40.00,
      width_cm: 10.00,
      height_cm: 35.00,
      weight_g: 300.00,
      description: 'A durable tote bag made from 100% organic cotton, ideal for groceries and daily errands.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Biodegradable Phone Case',
      series: 'EcoCover',
      brand: 'GreenTech',
      category: 'Electronics',
      SKU: 'GTC-CASE-003',
      barcode: '1234567890789',
      market_region: 'Asia',
      length_cm: 15.00,
      width_cm: 7.00,
      height_cm: 1.00,
      weight_g: 100.00,
      description: 'An eco-friendly phone case made from biodegradable materials, stylish and sustainable.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Solar-Powered Backpack',
      series: 'SunCharger',
      brand: 'GreenTech',
      category: 'Accessories',
      SKU: 'GTC-BACK-004',
      barcode: '1234567890987',
      market_region: 'Global',
      length_cm: 50.00,
      width_cm: 20.00,
      height_cm: 30.00,
      weight_g: 1200.00,
      description: 'A versatile backpack with solar panels to charge your devices on the go.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Bamboo Cutlery Set',
      series: 'EcoDine',
      brand: 'EcoLife',
      category: 'Kitchenware',
      SKU: 'ECO-CUT-005',
      barcode: '1234567890654',
      market_region: 'Australia',
      length_cm: 10.00,
      width_cm: 5.00,
      height_cm: 2.00,
      weight_g: 200.00,
      description: 'A compact, reusable cutlery set made from sustainable bamboo.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Recycled Notebook',
      series: 'Paper Saver',
      brand: 'EcoLife',
      category: 'Stationery',
      SKU: 'ECO-NB-006',
      barcode: '1234567890999',
      market_region: 'South America',
      length_cm: 25.00,
      width_cm: 18.00,
      height_cm: 2.00,
      weight_g: 400.00,
      description: 'A notebook made from 100% recycled paper.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Organic Facial Wipes',
      series: 'SkinCare+',
      brand: 'GreenBeauty',
      category: 'Personal Care',
      SKU: 'GB-FW-007',
      barcode: '1234567890543',
      market_region: 'Middle East',
      length_cm: 15.00,
      width_cm: 10.00,
      height_cm: 5.00,
      weight_g: 250.00,
      description: 'Gentle and organic facial wipes for all skin types.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      product_name: 'Compostable Trash Bags',
      series: 'GreenBin',
      brand: 'EcoLife',
      category: 'Household',
      SKU: 'ECO-TB-008',
      barcode: '1234567890234',
      market_region: 'Global',
      length_cm: 45.00,
      width_cm: 40.00,
      height_cm: 2.00,
      weight_g: 1500.00,
      description: 'Durable trash bags that are fully compostable.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
  ];
  
  let successCount = 0;
  
  // Insert data with ON CONFLICT to avoid duplicates
  for (const product of products) {
    try {
      await knex('products')
        .insert(product)
        .onConflict('SKU') // Specify the column with the unique constraint
        .ignore(); // Ignore if the SKU already exists
      successCount++;
    } catch (error) {
      console.error('Error seeding product:', product.SKU, error.message);
    }
  }
  
  console.log(`${successCount} Products seeded successfully.`);
};
