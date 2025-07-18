const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding payment_methods...');

  const existing = await knex('payment_methods').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Payment methods already seeded. Skipping.');
    return;
  }

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const now = knex.fn.now();
  
  const methodList = [
    {
      name: 'Credit Card',
      code: 'CREDIT_CARD',
      description: 'Payment via Visa, Mastercard, AMEX, or other credit cards',
      is_active: true,
      display_order: 1,
    },
    {
      name: 'Debit Card',
      code: 'DEBIT_CARD',
      description: 'Payment via debit card (linked to bank account)',
      is_active: false,
      display_order: 2,
    },
    {
      name: 'PayPal',
      code: 'PAYPAL',
      description: 'Online payment via PayPal account',
      is_active: true,
      display_order: 3,
    },
    {
      name: 'Apple Pay',
      code: 'APPLE_PAY',
      description: 'Contactless payment using Apple Pay',
      is_active: false,
      display_order: 4,
    },
    {
      name: 'Google Pay',
      code: 'GOOGLE_PAY',
      description: 'Contactless payment using Google Pay',
      is_active: false,
      display_order: 5,
    },
    {
      name: 'Bank Transfer',
      code: 'BANK_TRANSFER',
      description: 'Manual bank-to-bank transfer initiated by customer',
      is_active: true,
      display_order: 6,
    },
    {
      name: 'Wire Transfer',
      code: 'WIRE_TRANSFER',
      description: 'International or domestic wire transfer via financial institution',
      is_active: false,
      display_order: 7,
    },
    {
      name: 'Cash',
      code: 'CASH',
      description: 'Cash payment made in person or upon delivery',
      is_active: true,
      display_order: 8,
    },
    {
      name: 'Cheque',
      code: 'CHEQUE',
      description: 'Payment by physical or electronic cheque',
      is_active: true,
      display_order: 9,
    },
    {
      name: 'E-Transfer',
      code: 'E_TRANSFER',
      description: 'Interac e-Transfer or similar electronic fund transfer',
      is_active: true,
      display_order: 10,
    },
    {
      name: 'Net Terms (Net 30)',
      code: 'NET_30',
      description: 'Payment due within 30 days of invoice date (Net 30)',
      is_active: true,
      display_order: 11,
    },
    {
      name: 'Store Credit',
      code: 'STORE_CREDIT',
      description: 'Payment using previously issued store credit',
      is_active: false,
      display_order: 12,
    },
    {
      name: 'Gift Card',
      code: 'GIFT_CARD',
      description: 'Payment via company-issued or third-party gift cards',
      is_active: false,
      display_order: 13,
    },
    {
      name: 'ACH',
      code: 'ACH',
      description: 'Automated Clearing House transfer for U.S. banks',
      is_active: false,
      display_order: 14,
    },
    {
      name: 'Crypto',
      code: 'CRYPTO',
      description: 'Cryptocurrency payment (e.g., Bitcoin, Ethereum)',
      is_active: false,
      display_order: 15,
    },
  ];
  
  const records = methodList.map((method) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: method.name,
    code: method.code,
    description: method.description,
    is_active: method.is_active,
    display_order: method.display_order,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('payment_methods').insert(records).onConflict('code').ignore();
  
  console.log(`Seeded ${records.length} payment methods.`);
};
