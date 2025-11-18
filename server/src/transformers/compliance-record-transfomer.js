/**
 * @typedef {Object} SliceSkuDetailCompliance
 * @property {string} type                    - Compliance type (NPN, FDA, COA, etc.)
 * @property {string} complianceId             - Compliance document number
 * @property {string|Date} issuedDate          - Issue date
 * @property {string|Date} expiryDate          - Expiry date
 * @property {Object} metadata                 - Metadata container
 * @property {Object} [metadata.status]        - Status info
 * @property {string} metadata.status.id       - Status UUID
 * @property {string} metadata.status.name     - Status name
 * @property {string|Date} metadata.status.date - Status timestamp
 * @property {string} metadata.description     - Compliance description
 * @property {Object} [audit]                  - Audit container
 * @property {string|Date} audit.createdAt     - Created timestamp
 * @property {string|Date} audit.updatedAt     - Updated timestamp
 * @property {Object} audit.createdBy          - { id, firstname, lastname }
 * @property {Object} audit.updatedBy          - { id, firstname, lastname } or null
 */

/**
 * @typedef {Object} SkuDetailCompliance
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
  
  // Build metadata block only if it exists
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
  
  // Build audit block only if it exists
  const audit = row.audit
    ? {
      createdAt: row.audit.createdAt,
      updatedAt: row.audit.updatedAt,
      createdBy: row.audit.createdBy,
      updatedBy: row.audit.updatedBy,
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
