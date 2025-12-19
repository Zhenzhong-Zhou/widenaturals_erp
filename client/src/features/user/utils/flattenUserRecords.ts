import type {
  FlattenedUserRecord,
  UserCardView,
  UserListView
} from '@features/user/state';
import type {
  GenericAudit,
  GenericStatus
} from '@shared-types/api';

/**
 * Flattens user list records into a table-friendly structure.
 *
 * Includes:
 *  - Identity info (name, email, job title)
 *  - Role info (role name)
 *  - Status info (status name + date)
 *  - Audit info (createdBy, createdAt, updatedBy, updatedAt)
 *  - Avatar image URL
 *
 * This utility is intended for:
 *  - data tables
 *  - export views
 *  - simplified UI rendering layers
 *
 * @param records - Array of UserCardView or UserListView returned from the paginated users API
 * @returns Flat array of FlattenedUserRecord
 */
export const flattenUserRecords = (
  records: Array<UserCardView | UserListView>
): FlattenedUserRecord[] => {
  if (!Array.isArray(records)) return [];
  
  return records.map((record) => {
    // ---------------------------
    // Normalize status
    // ---------------------------
    let status: GenericStatus | undefined;
    
    if ('status' in record && record.status) {
      status = record.status;
    } else if ('statusName' in record && record.statusName) {
      status = {
        name: record.statusName,
      } as GenericStatus;
    }
    
    // ---------------------------
    // Normalize audit
    // ---------------------------
    let audit: GenericAudit | undefined;
    
    if ('audit' in record && record.audit) {
      audit = record.audit;
    }
    
    return {
      // ------------------------------
      // Identity Info
      // ------------------------------
      userId: record.id ?? null,
      fullName: record.fullName ?? '—',
      email: 'email' in record ? record.email ?? '—' : '—',
      phoneNumber: record.phoneNumber ?? '-',
      jobTitle: record.jobTitle ?? '—',
      
      // ------------------------------
      // Role Info
      // ------------------------------
      roleName: record.roleName ?? '—',
      
      // ------------------------------
      // Avatar
      // ------------------------------
      avatarUrl: record.avatarUrl ?? null,
      
      // ------------------------------
      // Status Info
      // ------------------------------
      statusName: status?.name ?? '—',
      statusDate: status?.date ?? '',
      
      // ------------------------------
      // Audit Info
      // ------------------------------
      createdAt: audit?.createdAt ?? '',
      createdBy: audit?.createdBy?.name ?? '—',
      updatedAt: audit?.updatedAt ?? '',
      updatedBy: audit?.updatedBy?.name ?? '—',
    };
  });
};
