/**
 * @fileoverview
 * Manual test script for `fetchPaginatedProductsService`.
 *
 * **Purpose:**
 *  - Execute the product pagination service in isolation.
 *  - Verify filtering, sorting, and transformation logic.
 *  - Validate SQL joins (status, users) and pagination performance.
 *
 * **Usage:**
 *   node test-fetch-paginated-products.js
 *
 * **Prerequisites:**
 *  - PostgreSQL database seeded with `products`, `status`, and `users` data.
 *  - Root user (e.g., `root@widenaturals.com`) must exist.
 */

const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const {
  fetchPaginatedProductsService,
} = require('../../services/product-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: Products]';
  const startTime = Date.now();
  
  try {
    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} ❌ Test user not found for root@widenaturals.com`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, roleId };
    console.log(`${logContext} ✅ Test user loaded:`, testUser);
    
    // Step 2: Map logical sort key → actual column
    const sortMap = getSortMapForModule('productSortMap');
    const logicalSortKey = 'productName'; // change if you want to test another field
    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    
    console.log(
      `${logContext} ▶️ Using sort key: ${logicalSortKey} → column: ${sortByColumn}`
    );
    
    // Step 3: Define filters + pagination
    const filters = {
      // Example usage:
      // brand: 'Canaherb',
      // category: 'Herbal Natural',
      // keyword: 'Omega',
      // statusIds: ['uuid-active-status'],
    };
    const pagination = { page: 1, limit: 10 };
    
    // Step 4: Execute service
    console.log(`${logContext} ▶️ Running fetchPaginatedProductsService...`);
    const result = await fetchPaginatedProductsService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
    });
    
    // Step 5: Review results
    console.log(
      `${logContext} ✅ Service completed successfully in ${Date.now() - startTime}ms`
    );
    console.log(`${logContext} ▶️ Pagination:`, result.pagination);
    console.log(
      `${logContext} ▶️ Data Preview (first row):`,
      result.data?.[0] || 'No data'
    );
    console.log(`${logContext} ▶️ Full JSON:\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.error(`${logContext} ❌ Error:`, error.message);
    console.error(error.stack);
  } finally {
    client.release();
    // Give async logs time to flush before exit
    setTimeout(() => process.exit(0), 100);
  }
})();
