import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import type { Column } from '@components/common/CustomTable';
import TruncatedText from '@components/common/TruncatedText';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatImageUrl } from '@utils/formatImageUrl';
import { USER_DEFAULT_PLACEHOLDER } from '@utils/constants/assets';
import type { FlattenedUserRecord } from '@features/user/state';

/**
 * Returns column definitions for the Users list table.
 *
 * Includes:
 *  - Avatar image
 *  - Identity information (name, email, job title)
 *  - Role information
 *  - Status
 *  - Audit metadata
 *  - Optional drill-down expansion
 */
export const getUserListTableColumns = (
  expandedRowId?: string,
  onDrillDownToggle?: (id: string) => void
): Column<FlattenedUserRecord>[] => {
  const columns: Column<FlattenedUserRecord>[] = [
    // ------------------------------
    // Avatar Column
    // ------------------------------
    {
      id: 'avatarUrl',
      label: 'Avatar',
      sortable: false,
      align: 'center',
      renderCell: (row) => (
        <Avatar
          src={
            row.avatarUrl
              ? formatImageUrl(row.avatarUrl)
              : USER_DEFAULT_PLACEHOLDER
          }
          alt={row.fullName}
          sx={{
            width: 40,
            height: 40,
            border: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
            fontSize: 14,
          }}
        >
          {row.fullName?.charAt(0) ?? '?'}
        </Avatar>
      ),
    },
    
    // ------------------------------
    // Identity Info
    // ------------------------------
    {
      id: 'fullName',
      label: 'Name',
      sortable: true,
      renderCell: (row) => (
        <Link to={`/users/${row.userId}`}>
          <TruncatedText
            text={formatLabel(row.fullName) ?? '—'}
            maxLength={28}
            variant="body2"
            sx={{
              color: '#1976D2',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
          />
        </Link>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
      renderCell: (row) => row.email ?? '—',
    },
    {
      id: 'jobTitle',
      label: 'Job Title',
      sortable: true,
      renderCell: (row) => formatLabel(row.jobTitle) ?? '—',
    },
    
    // ------------------------------
    // Role Info
    // ------------------------------
    {
      id: 'roleName',
      label: 'Role',
      sortable: true,
      renderCell: (row) => formatLabel(row.roleName) ?? '—',
    },
    
    // ------------------------------
    // Status Info
    // ------------------------------
    {
      id: 'statusName',
      label: 'Status',
      sortable: true,
      renderCell: (row) => formatLabel(row.statusName) ?? '—',
    },
    
    // ------------------------------
    // Audit Info
    // ------------------------------
    {
      id: 'createdBy',
      label: 'Created By',
      sortable: false,
      renderCell: (row) => formatLabel(row.createdBy) ?? '—',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      sortable: true,
      renderCell: (row) =>
        row.createdAt
          ? formatDateTime(row.createdAt)
          : '—',
    },
  ];
  
  // ------------------------------
  // Drill-down Expansion Column
  // ------------------------------
  if (onDrillDownToggle) {
    columns.push(
      createDrillDownColumn<FlattenedUserRecord>(
        (row) => onDrillDownToggle(row.userId ?? ''),
        (row) => expandedRowId === row.userId
      )
    );
  }
  
  return columns;
};
