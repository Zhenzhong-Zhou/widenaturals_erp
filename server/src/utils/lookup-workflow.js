/**
 * @file lookup-workflow.js
 * @description Generic orchestrator for permission-gated lookup queries.
 * Resolves ACL, applies visibility filters, queries the repository, optionally
 * enriches rows, and transforms the result — in a single reusable pipeline.
 */

'use strict';

/**
 * Executes a standard lookup workflow: ACL resolution → filter application
 * → repository query → optional row enrichment → transformation.
 *
 * @param {object} options
 * @param {AuthUser} options.user - Authenticated user making the request.
 * @param {object} [options.filters={}] - Raw filters from the request.
 * @param {number} [options.limit=50] - Maximum number of rows to return.
 * @param {number} [options.offset=0] - Pagination offset.
 * @param {Function} options.repository - Async function that accepts `{ filters, limit, offset }` and returns `{ data, pagination }`.
 * @param {Function} options.aclEvaluator - Async function that accepts a user and returns an ACL object.
 * @param {Function} options.aclFilterApplier - Pure function that accepts `(filters, acl)` and returns adjusted filters.
 * @param {Function} options.transformer - Function that accepts `({ data, pagination }, acl)` and returns the final response shape.
 * @param {Function} [options.rowEnricher] - Optional function applied to each row when enrichment is active.
 * @param {Function} [options.enrichmentCondition] - Optional predicate `(acl) => boolean` that determines whether enrichment runs.
 * @returns {Promise<object>} Transformed lookup result.
 */
const executeLookupWorkflow = async ({
  user,
  filters = {},
  limit = 50,
  offset = 0,
  repository,
  aclEvaluator,
  aclFilterApplier,
  transformer,
  rowEnricher,
  enrichmentCondition,
}) => {
  const acl = await aclEvaluator(user);

  const adjustedFilters = aclFilterApplier(filters, acl);

  const { data = [], pagination = {} } = await repository({
    filters: adjustedFilters,
    limit,
    offset,
  });

  const shouldEnrich =
    typeof enrichmentCondition === 'function'
      ? enrichmentCondition(acl)
      : false;

  const enrichedRows =
    shouldEnrich && rowEnricher ? data.map(rowEnricher) : data;

  return transformer({ data: enrichedRows, pagination }, acl);
};

module.exports = {
  executeLookupWorkflow,
};
