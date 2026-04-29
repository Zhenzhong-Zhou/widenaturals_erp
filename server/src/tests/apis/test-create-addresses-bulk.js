/**
 * @fileoverview
 * Manual test script for `createAddressService`.
 *
 * Purpose:
 *   - Execute and verify address creation workflow.
 *   - Validate bulk insert with conflict handling (upsert on address_hash).
 *   - Inspect DB changes and structured logs.
 *
 * Usage:
 *   node test-create-addresses.js
 */

'use strict';

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const { createAddressService } = require('../../services/address-service');

(async () => {
  const logPrefix = chalk.cyan('[Test: CREATE_ADDRESSES]');
  const startTime = performance.now();

  let client;

  try {
    console.log(`${logPrefix} 🚀 Starting address creation test...`);

    // ------------------------------------------------------------
    // 1. Connect to DB
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);

    // ------------------------------------------------------------
    // 2. Load test user
    // ------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    if (users.length === 0) {
      throw new Error('Test user root@widenaturals.com not found.');
    }

    const testUser = {
      id: users[0].id,
      roleId: users[0].role_id,
    };

    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );

    // ------------------------------------------------------------
    // 3. Load a test customer to attach addresses to
    // ------------------------------------------------------------
    const { rows: customers } = await client.query(
      `SELECT id, firstname, lastname, email FROM customers LIMIT 1`
    );

    if (customers.length === 0) {
      throw new Error('No customers found for address creation test.');
    }

    const testCustomer = customers[0];

    console.log(`${logPrefix} 👥 Using customer`);
    console.table(customers);

    // ------------------------------------------------------------
    // 4. Prepare address payloads
    // ------------------------------------------------------------
    const addresses = [
      {
        customer_id: testCustomer.id,
        full_name: `${testCustomer.firstname} ${testCustomer.lastname}`,
        phone: '604-555-0101',
        email: testCustomer.email,
        label: 'Shipping',
        address_line1: '123 Main Street',
        address_line2: 'Suite 100',
        city: 'Vancouver',
        state: 'BC',
        postal_code: 'V6B 1A1',
        country: 'Canada',
        region: 'West',
        note: 'Leave at front door',
      },
      {
        customer_id: testCustomer.id,
        full_name: `${testCustomer.firstname} ${testCustomer.lastname}`,
        phone: '604-555-0202',
        email: testCustomer.email,
        label: 'Billing',
        address_line1: '456 Commerce Ave',
        address_line2: null,
        city: 'Toronto',
        state: 'ON',
        postal_code: 'M5H 2N2',
        country: 'Canada',
        region: 'East',
        note: null,
      },
      {
        customer_id: null, // no customer — standalone address
        full_name: 'Warehouse Receiving',
        phone: null,
        email: null,
        label: 'Warehouse',
        address_line1: '789 Industrial Blvd',
        address_line2: 'Unit 5',
        city: 'Mississauga',
        state: 'ON',
        postal_code: 'L5T 1Z9',
        country: 'Canada',
        region: null,
        note: 'Loading dock entrance only',
      },
    ];

    console.log(`${logPrefix} 📦 Prepared address payloads`);
    console.table(
      addresses.map((a) => ({
        customer_id: a.customer_id ?? '(none)',
        label: a.label,
        full_name: a.full_name,
        city: a.city,
        postal_code: a.postal_code,
        country: a.country,
      }))
    );

    // ------------------------------------------------------------
    // 5. Call service
    // ------------------------------------------------------------
    console.log(`${logPrefix} ▶️  Calling createAddressService...`);

    const results = await createAddressService(addresses, testUser);

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Service returned invalid result.');
    }

    console.log(`${logPrefix} ✅ Addresses created successfully`);
    console.table(results);

    // ------------------------------------------------------------
    // 6. Verify addresses in DB
    // ------------------------------------------------------------
    const ids = results.map((r) => `'${r.id}'`).join(', ');

    const { rows: addressRows } = await client.query(
      `
      SELECT
        id,
        customer_id,
        label,
        full_name,
        city,
        postal_code,
        country,
        address_hash,
        created_at
      FROM addresses
      WHERE id IN (${ids})
      ORDER BY created_at DESC
      `
    );

    console.log(`${logPrefix} 🔎 Verified addresses in database`);
    console.table(addressRows);

    // ------------------------------------------------------------
    // 7. Verify upsert — re-run same addresses, expect no duplicates
    // ------------------------------------------------------------
    console.log(
      `${logPrefix} 🔁 Re-running same addresses to verify upsert (conflict handling)...`
    );

    const upsertResults = await createAddressService(addresses, testUser);

    const { rows: upsertRows } = await client.query(
      `
      SELECT id, label, address_hash, updated_at
      FROM addresses
      WHERE customer_id = $1
      ORDER BY created_at DESC
      `,
      [testCustomer.id]
    );

    console.log(`${logPrefix} ✅ Upsert verified — no duplicate addresses`);
    console.table(upsertRows);

    // ------------------------------------------------------------
    // 8. Performance timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

    logSystemInfo('Address creation test completed', {
      context: 'test-create-addresses',
      addressCount: results.length,
      elapsedSeconds: elapsed,
    });

    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);

    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);

    logSystemException(error, 'Address creation test failed', {
      context: 'test-create-addresses',
    });

    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released`);

    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed`);

    process.exit(process.exitCode);
  }
})();
