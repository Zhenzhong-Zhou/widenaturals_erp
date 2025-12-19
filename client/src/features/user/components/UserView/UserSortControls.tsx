import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { UserSortField } from '@features/user/state/userTypes';

interface UserSortControlsProps {
  sortBy: UserSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: UserSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

/**
 * Sort options for User list pages.
 *
 * Order is intentional:
 * - Identity fields first
 * - Role / status next
 * - Audit fields last
 * - Default fallback at the end
 */
const userSortOptions: { label: string; value: UserSortField }[] = [
  // ---- Identity fields ----
  { label: 'Full Name', value: 'fullName' },
  { label: 'First Name', value: 'firstname' },
  { label: 'Last Name', value: 'lastname' },
  { label: 'Email', value: 'email' },
  { label: 'Phone Number', value: 'phoneNumber' },
  { label: 'Job Title', value: 'jobTitle' },
  
  // ---- Role / status ----
  { label: 'Role', value: 'roleName' },
  { label: 'Status', value: 'statusName' },
  
  // ---- Audit fields ----
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  
  // ---- Default fallback ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const UserSortControls: FC<UserSortControlsProps> = ({
                                                       sortBy,
                                                       sortOrder,
                                                       onSortByChange,
                                                       onSortOrderChange,
                                                     }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={userSortOptions}
      onSortByChange={(val) => onSortByChange(val as UserSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default UserSortControls;
