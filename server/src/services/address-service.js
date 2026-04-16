/**
 * @file address-service.js
 * @description Business logic for address creation and paginated retrieval.
 *
 * Exports:
 *   - createAddressService           – bulk-insert addresses with hash generation
 *   - fetchPaginatedAddressesService – paginated address retrieval with filtering/sorting
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, validators) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }          = require('../database/db');
const MAX_LIMITS                   = require('../utils/constants/general/max-limits');
const { validateBulkInputSize }    = require('../utils/validation/bulk-input-validator');
const AppError                     = require('../utils/AppError');
const { generateAddressHash }      = require('../utils/hash-utils');
const {
  insertAddressRecords,
  getEnrichedAddressesByIds,
  getPaginatedAddresses,
} = require('../repositories/address-repository');
const { logSystemInfo }            = require('../utils/logging/system-logger');
const {
  transformEnrichedAddresses,
  transformPaginatedAddressResults,
} = require('../transformers/address-transformer');
const { filterAddressForViewer }   = require('../business/address-business');

/**
 * Creates one or more address records with hash generation and DB insertion.
 *
 * Enriches each address with a generated hash and `created_by`, performs a bulk
 * insert with conflict handling, then retrieves and transforms the inserted records.
 * Applies permission-based field filtering before returning.
 *
 * @param {Array<Object>} addresses        - Address objects to insert.
 * @param {Object}        user             - Authenticated user (requires `id` and `role`).
 * @param {string}        [purpose='insert_response'] - Response shape purpose:
 *                                           `'insert_response'` | `'detail_view'` | `'admin_view'`
 *
 * @returns {Promise<Array<Object>>} Transformed and permission-filtered address records.
 *
 * @throws {AppError} Re-throws AppErrors from validators/repository unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createAddressService = async (
  addresses,
  user,
  purpose = 'insert_response'
) => {
  const createdBy = user.id;
  
  return withTransaction(async (client) => {
    try {
      validateBulkInputSize(
        addresses,
        MAX_LIMITS.BULK_INPUT_LIMITS.MAX_UI_INSERT_SIZE,
        'addresses'
      );
      
      const enrichedAddresses = addresses.map((address) => ({
        ...address,
        address_hash: generateAddressHash(address),
        created_by:   createdBy,
      }));
      
      const inserted = await insertAddressRecords(enrichedAddresses, client);
      
      if (!Array.isArray(inserted) || inserted.length === 0) {
        throw AppError.databaseError('No address records were inserted.');
      }
      
      // Audit trail — intentional low-frequency compliance event; not a routine read log.
      logSystemInfo('Address bulk insert completed', {
        context:       'address-service/createAddressService',
        insertedCount: inserted.length,
        requestedBy:   createdBy,
      });
      
      const insertedIds     = inserted.map((row) => row.id);
      const rawResult       = await getEnrichedAddressesByIds(insertedIds, client);
      const enrichedRecords = transformEnrichedAddresses(rawResult);
      
      // filterAddressForViewer is async — run concurrently, not sequentially.
      return Promise.all(
        enrichedRecords.map((address) =>
          filterAddressForViewer(address, user, purpose)
        )
      );
    } catch (error) {
      // AppErrors from validators/repository already carry the correct type —
      // re-throw unchanged so globalErrorHandler receives the original context.
      if (error instanceof AppError) throw error;
      
      // Unexpected error — wrap once with service context before bubbling up.
      throw AppError.serviceError('Unable to create address records.', {
        meta: { error: error.message },
      });
    }
  });
};

/**
 * Fetches paginated address records with optional filtering and sorting.
 *
 * Delegates query execution to the repository, transforms raw DB rows into the
 * client-facing shape, and returns paginated results with metadata.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]         - Field filters (city, country, customerId, etc.).
 * @param {number}        [options.page=1]             - Page number (1-based).
 * @param {number}        [options.limit=10]           - Records per page.
 * @param {string}        [options.sortBy='createdAt'] - Sort field key (validated against addressSortMap).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']   - Sort direction.
 *
 * @returns {Promise<{ data: Array<Object>, pagination: Object }>} Transformed records and pagination metadata.
 *
 * @throws {AppError} Re-throws AppErrors from the repository unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedAddressesService = async ({
                                                filters   = {},
                                                page      = 1,
                                                limit     = 10,
                                                sortBy    = 'createdAt',
                                                sortOrder = 'DESC',
                                              }) => {
  try {
    const rawResult = await getPaginatedAddresses({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedAddressResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch paginated addresses.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  createAddressService,
  fetchPaginatedAddressesService,
};
