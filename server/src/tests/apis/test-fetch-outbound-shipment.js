const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const {
  fetchPaginatedOutboundFulfillmentService,
} = require('../../services/outbound-fulfillment-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: OutboundFulfillment]';
  const startTime = Date.now();

  try {
    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );

    if (rows.length === 0) {
      console.error(
        `${logContext} ❌ Test user not found for email root@widenaturals.com`
      );
      return;
    }

    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, roleId };

    console.log(`${logContext} ✅ Test user loaded:`, testUser);

    // Step 2: Map logical sort key → actual column
    const sortMap = getSortMapForModule('outboundShipmentSortMap');
    const logicalSortKey = 'shipmentStatus'; // adjust if needed

    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    console.log(
      `${logContext} ▶️ Using sort key: ${logicalSortKey} → column: ${sortByColumn}`
    );

    // Step 3: Define filters + pagination
    const filters = {
      // Example usage:
      // statusIds: ['uuid-1', 'uuid-2'],
      // warehouseIds: ['uuid-warehouse'],
      // keyword: 'search-term',
    };

    const pagination = { page: 1, limit: 10 };

    // Step 4: Execute service
    console.log(
      `${logContext} ▶️ Running fetchPaginatedOutboundFulfillmentService...`
    );
    const result = await fetchPaginatedOutboundFulfillmentService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
    });

    // Step 5: Review Results
    console.log(
      `${logContext} ✅ Service completed successfully in ${Date.now() - startTime}ms`
    );
    console.log(`${logContext} ▶️ Pagination:`, result.pagination);
    console.log(
      `${logContext} ▶️ Data Preview (first row):`,
      result.data?.[0] || 'No data'
    );
    console.log(
      `${logContext} ▶️ Full JSON: \n${JSON.stringify(result, null, 2)}`
    );
  } catch (error) {
    console.error(`${logContext} ❌ Error:`, error.message);
    console.error(error.stack);
  } finally {
    client.release();
    // Allow async logs to flush before exit
    setTimeout(() => process.exit(0), 100);
  }
})();
