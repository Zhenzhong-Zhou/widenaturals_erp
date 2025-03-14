const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  try {
    console.log('Seeding pricing data...');

    const activeStatusId = await fetchDynamicValue(
      knex,
      'status',
      'name',
      'active',
      'id'
    );
    const locationId = await fetchDynamicValue(
      knex,
      'locations',
      'name',
      'Head Office Canada',
      'id'
    );
    const systemUserId = await fetchDynamicValue(
      knex,
      'users',
      'email',
      'system@internal.local',
      'id'
    );

    // Fetch pricing types
    const pricingTypes = await knex('pricing_types')
      .select('id', 'name')
      .whereIn('name', [
        'Wholesale',
        'Retail',
        'MSRP',
        'Friend and Family Price',
      ]);

    // Function to fetch pricing type ID by name
    const getPricingTypeId = (name) =>
      pricingTypes.find((type) => type.name === name)?.id;

    // Fetch product IDs
    const productNames = [
      'NMN 3000 - INT',
      'NMN 3000 - CA',
      'NMN 6000 - INT',
      'NMN 6000 - CA',
      'NMN 10000 - INT',
      'NMN 10000 - CA',
      'NMN 15000 - INT',
      'NMN 15000 - CA',
      'NMN 30000 - INT',
      'NMN 30000 - CA',
      'Virility - INT',
      'Virility - CA',

      'Memory - INT',
      'Memory - CA',
      'Immune - INT',
      'Immune - CA',
      'Focus - INT',
      'Focus - CA',
      'Sleep - INT',
      'Sleep - CA',
      'Gut Health - INT',
      'Gut Health - CA',
      'Menopause - INT',
      'Menopause - CA',
      'Mood - INT',
      'Mood - CA',
      'Hair Health - INT',
      'Hair Health',
      'Pain Relief - INT',
      'Pain Relief Topical Stick',

      'Seal Oil - 180 Softgels',
      'Seal Oil - 120 Softgels',
      'EPA 900 - 120 Softgels',
      'EPA 900 - 60 Softgels',
      'Omega-3 900 - 120 Softgels',
      'Omega-3 900 - 60 Softgels',
      'MultiVitamin Fish Oil - 120 Softgels',
      'MultiVitamin Fish Oil - 60 Softgels',
      'Algal Oil Kids - 60 Softgels',
      'Algal Oil Kids - 30 Softgels',
      'Algal Oil Pregnant - 60 Softgels',
      'Algal Oil Pregnant - 30 Softgels',
    ];

    const products = await knex('products')
      .select('id', 'product_name')
      .whereIn('product_name', productNames);

    // Function to get product ID by name
    const getProductId = (name) => {
      const foundProduct = products.find(
        (product) => product.product_name === name
      );
      if (!foundProduct) {
        console.warn(`⚠️ Product not found: ${name}`);
      }
      return foundProduct?.id || null;
    };

    // Pricing data
    const pricingData = [
      {
        name: 'NMN 3000 - INT',
        wholesale: 58,
        msrp: 110,
        friend_and_family: 116,
        retail: 350,
      },
      {
        name: 'NMN 3000 - CA',
        wholesale: 58,
        msrp: 110,
        friend_and_family: 116,
        retail: 350,
      },
      {
        name: 'NMN 6000 - INT',
        wholesale: 75,
        msrp: 200,
        friend_and_family: 150,
        retail: 650,
      },
      {
        name: 'NMN 6000 - CA',
        wholesale: 75,
        msrp: 200,
        friend_and_family: 150,
        retail: 650,
      },
      {
        name: 'NMN 10000 - INT',
        wholesale: 98,
        msrp: 280,
        friend_and_family: 196,
        retail: 950,
      },
      {
        name: 'NMN 10000 - CA',
        wholesale: 98,
        msrp: 280,
        friend_and_family: 196,
        retail: 950,
      },
      {
        name: 'NMN 15000 - INT',
        wholesale: 125,
        msrp: 450,
        friend_and_family: 250,
        retail: 1480,
      },
      {
        name: 'NMN 15000 - CA',
        wholesale: 125,
        msrp: 450,
        friend_and_family: 250,
        retail: 1480,
      },
      {
        name: 'NMN 30000 - INT',
        wholesale: 184,
        msrp: 730,
        friend_and_family: 368,
        retail: 2400,
      },
      {
        name: 'NMN 30000 - CA',
        wholesale: 184,
        msrp: 730,
        friend_and_family: 368,
        retail: 2400,
      },
      {
        name: 'Virility - INT',
        wholesale: 46,
        msrp: 180,
        friend_and_family: 92,
        retail: 600,
      },
      {
        name: 'Virility - CA',
        wholesale: 46,
        msrp: 180,
        friend_and_family: 92,
        retail: 600,
      },

      {
        name: 'Memory - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Memory - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Immune - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Immune - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Focus - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Focus - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Sleep - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Sleep - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Gut Health - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Gut Health - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Menopause - INT',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Menopause - CA',
        wholesale: 19.99,
        msrp: 42.99,
        friend_and_family: 30,
        retail: 42.99,
      },
      {
        name: 'Mood - INT',
        wholesale: 22.99,
        msrp: 48.99,
        friend_and_family: 35,
        retail: 48.99,
      },
      {
        name: 'Mood - CA',
        wholesale: 22.99,
        msrp: 48.99,
        friend_and_family: 35,
        retail: 48.99,
      },
      {
        name: 'Hair Health - INT',
        wholesale: 14.99,
        msrp: 35.99,
        friend_and_family: 25,
        retail: 35.99,
      },
      {
        name: 'Hair Health',
        wholesale: 14.99,
        msrp: 35.99,
        friend_and_family: 25,
        retail: 35.99,
      },
      {
        name: 'Pain Relief - INT',
        wholesale: 14.99,
        msrp: 29.99,
        friend_and_family: 20,
        retail: 29.99,
      },
      {
        name: 'Pain Relief Topical Stick',
        wholesale: 14.99,
        msrp: 29.99,
        friend_and_family: 20,
        retail: 29.99,
      },

      {
        name: 'Seal Oil - 180 Softgels',
        wholesale: 10.9,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        name: 'Seal Oil - 120 Softgels',
        wholesale: 8.9,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
      {
        name: 'EPA 900 - 120 Softgels',
        wholesale: 17.82,
        msrp: 40.98,
        friend_and_family: null,
        retail: 40.98,
      },
      {
        name: 'EPA 900 - 60 Softgels',
        wholesale: 10.13,
        msrp: 25.99,
        friend_and_family: null,
        retail: 25.99,
      },
      {
        name: 'Omega-3 900 - 120 Softgels',
        wholesale: 16.2,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        name: 'Omega-3 900 - 60 Softgels',
        wholesale: 9.32,
        msrp: 24.99,
        friend_and_family: null,
        retail: 24.99,
      },
      {
        name: 'MultiVitamin Fish Oil - 120 Softgels',
        wholesale: 16.2,
        msrp: 39.99,
        friend_and_family: null,
        retail: 39.99,
      },
      {
        name: 'MultiVitamin Fish Oil - 60 Softgels',
        wholesale: 9.32,
        msrp: 24.99,
        friend_and_family: null,
        retail: 24.99,
      },
      {
        name: 'Algal Oil Kids - 60 Softgels',
        wholesale: 11.61,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
      {
        name: 'Algal Oil Kids - 30 Softgels',
        wholesale: 6.62,
        msrp: 19.99,
        friend_and_family: null,
        retail: 19.99,
      },
      {
        name: 'Algal Oil Pregnant - 60 Softgels',
        wholesale: 11.61,
        msrp: 29.99,
        friend_and_family: null,
        retail: 29.99,
      },
      {
        name: 'Algal Oil Pregnant - 30 Softgels',
        wholesale: 6.62,
        msrp: 19.99,
        friend_and_family: null,
        retail: 19.99,
      },
    ];

    const fixedTimestamp = new Date('2025-03-01T00:00:00Z');

    // Format data for insertion
    const formattedPricing = [];
    pricingData.forEach((product) => {
      const productId = getProductId(product.name);
      if (!productId) return;

      formattedPricing.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          product_id: productId,
          price_type_id: getPricingTypeId('Wholesale'),
          location_id: locationId,
          price: product.wholesale,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          product_id: productId,
          price_type_id: getPricingTypeId('MSRP'),
          location_id: locationId,
          price: product.msrp,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          product_id: productId,
          price_type_id: getPricingTypeId('Retail'),
          location_id: locationId,
          price: product.retail,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        }
      );

      // ✅ Only add Friend & Family Price if it's not null
      if (product.friend_and_family !== null) {
        formattedPricing.push({
          id: knex.raw('uuid_generate_v4()'),
          product_id: productId,
          price_type_id: getPricingTypeId('Friend and Family Price'),
          location_id: locationId,
          price: product.friend_and_family,
          valid_from: fixedTimestamp,
          valid_to: null,
          status_id: activeStatusId,
          status_date: knex.fn.now(),
          created_by: systemUserId,
          updated_by: null,
        });
      }
    });

    // Insert into pricing table
    if (formattedPricing.length > 0) {
      await knex('pricing')
        .insert(formattedPricing)
        .onConflict([
          'product_id',
          'price_type_id',
          'location_id',
          'valid_from',
        ])
        .ignore(); // Prevent duplicate records
    }

    console.log(
      `${formattedPricing.length} pricing records seeded successfully.`
    );
  } catch (error) {
    console.error('Error seeding pricing data:', error.message);
    throw error;
  }
};
