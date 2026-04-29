/**
 * @file user-warehouse-assignment-queries.js
 * @description
 * SQL queries for user-to-warehouse assignment lookups.
 *
 * Exports:
 *  - USER_WAREHOUSE_ASSIGNMENT_QUERY
 */

'use strict';

const USER_WAREHOUSE_ASSIGNMENT_QUERY = `
  SELECT warehouse_id
  FROM user_warehouse_assignments
  WHERE user_id = $1
`;

module.exports = {
  USER_WAREHOUSE_ASSIGNMENT_QUERY,
};
