const { withTransaction } = require('../database/db');
const MAX_LIMITS = require('../utils/constants/general/max-limits');
const { validateBulkInputSize } = require('../utils/bulk-input-validator');
const AppError = require('../utils/AppError');
const { generateAddressHash } = require('../utils/crypto-utils');
const { insertAddressRecords, getEnrichedAddressesByIds } = require('../repositories/address-repository');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { transformEnrichedAddresses } = require('../transformers/address-transformer');
const { filterAddressForViewer } = require('../business/address-business');

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

module.exports = {
  createAddressService
};
