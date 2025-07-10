const { withTransaction } = require('../database/db');
const MAX_LIMITS = require('../utils/constants/general/max-limits');
const { validateBulkInputSize } = require('../utils/bulk-input-validator');
const AppError = require('../utils/AppError');
const { generateAddressHash } = require('../utils/crypto-utils');
const {
  insertAddressRecords,
  getEnrichedAddressesByIds,
  getPaginatedAddresses
} = require('../repositories/address-repository');
const {
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const {
  transformEnrichedAddresses,
  transformPaginatedAddressResults
} = require('../transformers/address-transformer');
const { filterAddressForViewer } = require('../business/address-business');
const { sanitizeSortBy } = require('../utils/sort-utils');

/**
 * Creates bulk address records with hash generation and DB insertion.
 *
 * - Enriches address data with address hashes and created_by.
 * - Performs bulk insert with conflict handling.
 * - Retrieves and transforms enriched address records.
 * - Applies permission-based filtering for the response.
 *
 * @param {Array<Object>} addresses - Array of address objects to insert.
 * @param {Object} user - an Authenticated user object with a role and id.
 * @param {string} [purpose='insert_response'] - The purpose of the response ('insert_response', 'detail_view', 'admin_view').
 * @returns {Promise<Array>} Inserted or upserted address records formatted for the viewer.
 * @throws {AppError} On validation or database error.
 */
const createAddressService = async (addresses, user, purpose = 'insert_response') => {
  const createdBy = user.id;
  
  return withTransaction(async (client) => {
    try {
      const max = MAX_LIMITS.BULK_INPUT_LIMITS.MAX_UI_INSERT_SIZE;
      
      validateBulkInputSize(
        addresses,
        max,
        'address-service/createAddressRecords',
        'addresses'
      );
      
      const enrichedAddresses = addresses.map((address) => ({
        ...address,
        address_hash: generateAddressHash(address),
        created_by: createdBy,
      }));
      
      const inserted =  await insertAddressRecords(enrichedAddresses, client);
      
      if (!Array.isArray(inserted) || inserted.length === 0) {
        throw AppError.databaseError('No customer records were inserted.');
      }
      
      const insertedIds = inserted.map((row) => row.id);
      
      logSystemInfo('Address bulk insert completed', {
        insertedCount: inserted.length,
        context: 'address-service/createAddressService',
      });
      
      const rawResult = await getEnrichedAddressesByIds(insertedIds, client);
      const enrichedRecords = transformEnrichedAddresses(rawResult);
      
      return enrichedRecords.map((address) =>
        filterAddressForViewer(address, user, purpose)
      );
    } catch (error) {
      logSystemException(error, 'Failed to create address records', {
        context: 'address-service/createAddressRecords',
        requestedBy: createdBy,
        addressCount: addresses?.length || 0,
      });
      throw AppError.businessError('Unable to create address records.', error);
    }
  });
};

/**
 * Fetches paginated addresses with optional filtering, sorting, and logging.
 *
 * Applies sorting rules based on the address sort map,
 * transforms raw DB rows into client-friendly format,
 * and logs the operation for monitoring.
 *
 * @param {Object} options - Service options.
 * @param {Object} [options.filters={}] - Filters to apply (e.g., city, country, customerId).
 * @param {Object} [options.user] - The user performing the request (for logging).
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='created_at'] - Field to sort by (uses addressSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result containing transformed address rows and pagination metadata.
 *
 * @throws {AppError} Throws a service error if fetching fails.
 */
const fetchPaginatedAddressesService = async ({
                                                filters = {},
                                                user,
                                                page = 1,
                                                limit = 10,
                                                sortBy = 'created_at',
                                                sortOrder = 'DESC',
                                              }) => {
  try {
    // Sanitize sortBy based on addressSortMap (you should define this map)
    const sortField = sanitizeSortBy(sortBy, 'addressSortMap');
    
    const rawResult = await getPaginatedAddresses({
      filters,
      page,
      limit,
      sortBy: sortField,
      sortOrder,
    });
    
    const result = transformPaginatedAddressResults(rawResult);
    
    logSystemInfo('Fetched paginated addresses', {
      context: 'address-service/fetchPaginatedAddressesService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy: sortField, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated addresses', {
      context: 'address-service/fetchPaginatedAddressesService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError('Failed to fetch address list.');
  }
};

module.exports = {
  createAddressService,
  fetchPaginatedAddressesService,
};
