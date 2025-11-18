const { getFullName } = require('../utils/name-utils');

/**
 * @typedef {Object} SliceSkuDetailCompliance
 * @description
 * Output from `sliceComplianceRecordsForUser()`. All fields are already
 * permission-filtered and safe for transformer usage.
 *
 * @property {string} id                                   - Compliance record ID
 * @property {string} type                                 - Compliance type (NPN, FDA, COA, etc.)
 * @property {string} complianceId                         - Compliance document number
 * @property {string|Date} issuedDate                      - Date the compliance was issued
 * @property {string|Date} expiryDate                      - Expiration date
 * @property {Object} metadata                             - Metadata container
 * @property {Object} [metadata.status]                    - Optional status info
 * @property {string} metadata.status.id                   - Status UUID
 * @property {string} metadata.status.name                 - Status name
 * @property {string|Date} metadata.status.date            - Status timestamp
 * @property {string} metadata.description                 - Description or note for the compliance record
 * @property {Object} [audit]                              - Optional audit metadata
 * @property {Object|null} audit.createdBy                 - Creator identity
 * @property {string} audit.createdBy.id                   - Creator user ID
 * @property {string} audit.createdBy.firstname            - Creator first name
 * @property {string} audit.createdBy.lastname             - Creator last name
 * @property {Object|null} audit.updatedBy                 - Updater identity
 * @property {string} audit.updatedBy.id                   - Updater user ID
 * @property {string} audit.updatedBy.firstname            - Updater first name
 * @property {string} audit.updatedBy.lastname             - Updater last name
 */

/**
 * @typedef {Object} SkuDetailCompliance
 * @property {string} id
 * @property {string} type
 * @property {string} complianceId
 * @property {string|Date|null} issuedDate
 * @property {string|Date|null} expiryDate
 */

/**
 * Transform a *sliced* compliance record into the final API-safe DTO.
 *
 * This function converts a permission-filtered compliance row
 * (SliceSkuDetailCompliance) into the normalized output structure
 * used in SKU detail responses (SkuDetailCompliance).
 *
 * Permission filtering MUST be handled upstream in
 * sliceComplianceRecordsForUser(). This transformer performs
 * only pure, stateless, null-safe field mapping.
 *
 * @param {SliceSkuDetailCompliance|null} row
 *        A single compliance record already processed by
 *        sliceComplianceRecordsForUser().
 *
 * @returns {SkuDetailCompliance|null}
 *        Normalized compliance DTO for the API.
 */
const transformComplianceRecord = (row) => {
  if (!row) return null;
  
  // Optional metadata
  const metadata = row.metadata
    ? {
      status: row.metadata.status
        ? {
          id: row.metadata.status.id,
          name: row.metadata.status.name,
          date: row.metadata.status.date,
        }
        : undefined,
      description: row.metadata.description,
    }
    : undefined;
  
  // Optional audit
  const audit = row.audit
    ? {
      createdAt: row.audit.createdAt,
      createdBy: row.audit.createdBy
        ? {
          id: row.audit.createdBy.id,
          fullName: getFullName(
            row.audit.createdBy.firstname,
            row.audit.createdBy.lastname
          ),
        }
        : null,
      updatedAt: row.audit.updatedAt,
      updatedBy: row.audit.updatedBy
        ? {
          id: row.audit.updatedBy.id,
          fullName: getFullName(
            row.audit.updatedBy.firstname,
            row.audit.updatedBy.lastname
          ),
        }
        : null,
    }
    : undefined;
  
  return {
    type: row.type,
    complianceId: row.complianceNumber,
    issuedDate: row.issuedDate,
    expiryDate: row.expiryDate,
    metadata,
    audit,
  };
};

module.exports = {
  transformComplianceRecord,
};
