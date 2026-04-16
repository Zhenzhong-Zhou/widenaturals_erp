/**
 * @file compliance-record-business.js
 * @description Domain business logic for compliance record access control
 * evaluation and row-level field slicing based on user permissions.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  COMPLIANCE_RECORD_CONSTANTS,
} = require('../utils/constants/domain/compliance-record-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

const CONTEXT = 'compliance-record-business';

/**
 * Resolves which compliance record viewing capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ComplianceViewAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateComplianceViewAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateComplianceViewAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewCompliance =
      isRoot ||
      permissions.includes(
        COMPLIANCE_RECORD_CONSTANTS.PERMISSIONS.VIEW_COMPLIANCE_RECORDINGS
      );

    const canViewComplianceMetadata =
      isRoot ||
      permissions.includes(
        COMPLIANCE_RECORD_CONSTANTS.PERMISSIONS
          .VIEW_COMPLIANCE_RECORDINGS_METADATA
      );

    const canViewComplianceHistory =
      isRoot ||
      permissions.includes(
        COMPLIANCE_RECORD_CONSTANTS.PERMISSIONS
          .VIEW_COMPLIANCE_RECORDINGS_HISTORY
      );

    const canViewInactiveCompliance =
      isRoot ||
      permissions.includes(
        COMPLIANCE_RECORD_CONSTANTS.PERMISSIONS
          .VIEW_COMPLIANCE_RECORDINGS_INACTIVE
      );

    return {
      canViewCompliance,
      canViewComplianceMetadata,
      canViewComplianceHistory,
      canViewInactiveCompliance,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate compliance access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate user access control for compliance records.'
    );
  }
};

/**
 * Filters and shapes a list of compliance record rows based on the user's
 * access flags.
 *
 * Inactive records are excluded unless `canViewInactiveCompliance` is true.
 * Metadata and audit fields are conditionally included based on the ACL.
 *
 * @param {object[]} complianceRows - Raw compliance record rows from the repository.
 * @param {ComplianceViewAcl} access - Resolved ACL from `evaluateComplianceViewAccessControl`.
 * @returns {object[]} Array of filtered and shaped compliance record objects.
 */
const sliceComplianceRecordsForUser = (complianceRows, access) => {
  if (!Array.isArray(complianceRows)) return [];

  const ACTIVE_STATUS_ID = getStatusId('general_active');
  const results = [];

  for (const row of complianceRows) {
    // Skip inactive records unless the user has explicit permission to view them.
    if (
      !access.canViewInactiveCompliance &&
      row.status_id !== ACTIVE_STATUS_ID
    ) {
      continue;
    }

    const safe = {
      id: row.id,
      type: row.type,
      complianceNumber: row.compliance_id,
      issuedDate: row.issued_date,
      expiryDate: row.expiry_date,
    };

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
