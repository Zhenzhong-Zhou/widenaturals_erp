const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  VIEW_COMPLIANCE_RECORDINGS,
  VIEW_COMPLIANCE_RECORDINGS_METADATA,
  VIEW_COMPLIANCE_RECORDINGS_HISTORY,
  VIEW_COMPLIANCE_RECORDINGS_INACTIVE,
} = require('../utils/constants/domain/permissions');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * Business: Determine what compliance record fields a user may view.
 *
 * Controls visibility of:
 *   ✔ Basic compliance info (type, compliance number, issued/expiry date)
 *   ✔ Metadata such as status + description
 *   ✔ Historical audit fields (created_by / updated_by)
 *   ✔ Inactive or expired compliance documents
 *
 * This does NOT fetch data and does NOT modify data — it only determines what
 * is allowed to appear in API responses.
 *
 * @param {Object} user - Authenticated user context
 * @returns {Promise<{
 *   canViewCompliance: boolean,
 *   canViewComplianceMetadata: boolean,
 *   canViewComplianceHistory: boolean,
 *   canViewInactiveCompliance: boolean
 * }>}
 */
const evaluateComplianceViewAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    // Basic permission — can user view compliance at all?
    const canViewCompliance =
      isRoot || permissions.includes(VIEW_COMPLIANCE_RECORDINGS);

    // Can view status, status_date, description
    const canViewComplianceMetadata =
      isRoot || permissions.includes(VIEW_COMPLIANCE_RECORDINGS_METADATA);

    // Can view created_by, updated_by, timestamps
    const canViewComplianceHistory =
      isRoot || permissions.includes(VIEW_COMPLIANCE_RECORDINGS_HISTORY);

    // Can view inactive / expired compliance documents
    const canViewInactiveCompliance =
      isRoot || permissions.includes(VIEW_COMPLIANCE_RECORDINGS_INACTIVE);

    return {
      canViewCompliance,
      canViewComplianceMetadata,
      canViewComplianceHistory,
      canViewInactiveCompliance,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate compliance access control', {
      context: 'compliance-business/evaluateComplianceViewAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate user access control for compliance records.',
      { details: err.message }
    );
  }
};

/**
 * Business: Remove restricted compliance fields from API output.
 *
 * The repository always returns full compliance rows. This function applies
 * access rules to reduce fields based on user visibility permissions.
 *
 * Behavior:
 *   ✔ Filters out inactive records for restricted users
 *   ✔ Reduces fields based on metadata + history visibility
 *   ✔ Returns safe, normalized objects for API response
 *   ✔ Never mutates the original repository rows
 *
 * @param {Array<Object>} complianceRows - Raw rows from repository
 * @param {Object} access - Flags from evaluateComplianceViewAccessControl()
 * @returns {Array<Object>} Sanitized compliance records
 */
const sliceComplianceRecordsForUser = (complianceRows, access) => {
  if (!Array.isArray(complianceRows)) return [];

  const ACTIVE_STATUS_ID = getStatusId('general_active');
  const results = [];

  for (const row of complianceRows) {
    // ---------------------------------------------------------
    // 1. Filter inactive compliance docs unless allowed
    // ---------------------------------------------------------
    if (
      !access.canViewInactiveCompliance &&
      row.status_id !== ACTIVE_STATUS_ID
    ) {
      continue;
    }

    // ---------------------------------------------------------
    // 2. Base safe object for all users
    // ---------------------------------------------------------
    const safe = {
      id: row.id,
      type: row.type,
      complianceNumber: row.compliance_id,
      issuedDate: row.issued_date,
      expiryDate: row.expiry_date,
    };

    // ---------------------------------------------------------
    // 3. Metadata: description, status fields
    // ---------------------------------------------------------
    if (access.canViewComplianceMetadata) {
      safe.metadata = {
        status: {
          id: row.status_id,
          name: row.status_name,
          date: row.status_date,
        },
        description: row.description,
      };
    }

    // ---------------------------------------------------------
    // 4. Audit history: created_by, updated_by
    // ---------------------------------------------------------
    if (access.canViewComplianceHistory) {
      safe.audit = compactAudit(makeAudit(row));
    }

    results.push(safe);
  }

  return results;
};

module.exports = {
  evaluateComplianceViewAccessControl,
  sliceComplianceRecordsForUser,
};
