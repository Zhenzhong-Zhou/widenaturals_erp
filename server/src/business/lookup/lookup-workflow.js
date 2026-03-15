const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const AppError = require('../../utils/AppError');

/**
 * Execute a standardized lookup workflow.
 *
 * This helper encapsulates the common pipeline used by lookup
 * services across the application:
 *
 * 1. Log request entry
 * 2. Resolve access-control rules
 * 3. Apply enforced filter rules
 * 4. Execute repository query
 * 5. Optionally enrich rows
 * 6. Transform into final API payload
 *
 * This reduces duplication across lookup services while keeping
 * domain-specific logic injectable.
 *
 * @async
 *
 * @param {Object} options
 *
 * @param {Object} options.user
 * Authenticated request user.
 *
 * @param {Object} options.filters
 * Raw query filters.
 *
 * @param {number} options.limit
 * Pagination limit.
 *
 * @param {number} options.offset
 * Pagination offset.
 *
 * @param {Function} options.repository
 * Repository lookup function.
 *
 * @param {Function} options.aclEvaluator
 * Function resolving permission context.
 *
 * @param {Function} options.aclFilterApplier
 * Function that applies visibility rules to filters.
 *
 * @param {Function} options.transformer
 * Final response transformer.
 *
 * @param {Function} [options.rowEnricher]
 * Optional row enrichment function.
 *
 * @param {Function} [options.enrichmentCondition]
 * Function that determines whether enrichment should run.
 *
 * @param {string} options.context
 * Logging context identifier.
 *
 * @returns {Promise<Object>}
 * Transformed lookup result.
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
                                       context,
                                     }) => {
  try {
    //---------------------------------------------------------
    // Step 1 — Log request entry
    //---------------------------------------------------------
    logSystemInfo('Executing lookup workflow', {
      context,
      metadata: { filters, limit, offset },
    });
    
    //---------------------------------------------------------
    // Step 2 — Resolve access control
    //---------------------------------------------------------
    const acl = await aclEvaluator(user);
    
    //---------------------------------------------------------
    // Step 3 — Apply ACL filter rules
    //---------------------------------------------------------
    const adjustedFilters = aclFilterApplier(filters, acl);
    
    //---------------------------------------------------------
    // Step 4 — Repository query
    //---------------------------------------------------------
    const { data = [], pagination = {} } = await repository({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    //---------------------------------------------------------
    // Step 5 — Optional row enrichment
    //---------------------------------------------------------
    const shouldEnrich =
      typeof enrichmentCondition === 'function'
        ? enrichmentCondition(acl)
        : false;
    
    const enrichedRows =
      shouldEnrich && rowEnricher
        ? data.map(rowEnricher)
        : data;
    
    //---------------------------------------------------------
    // Step 6 — Transform final response
    //---------------------------------------------------------
    return transformer(
      { data: enrichedRows, pagination },
      acl
    );
  } catch (err) {
    logSystemException(err, 'Lookup workflow failed', {
      context,
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Lookup workflow failed.', {
      details: err.message,
      stage: context,
    });
  }
};

module.exports = {
  executeLookupWorkflow,
};
