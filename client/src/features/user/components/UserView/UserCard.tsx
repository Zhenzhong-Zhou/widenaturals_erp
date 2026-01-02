import { type FC, memo } from 'react';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CustomCard from '@components/common/CustomCard';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';
import { formatImageUrl } from '@utils/formatImageUrl';
import { USER_DEFAULT_PLACEHOLDER } from '@utils/constants/assets';
import { FlattenedUserRecord } from '@features/user/state';

interface UserCardProps {
  user: FlattenedUserRecord;
}

/**
 * UserCard
 *
 * Card-style, read-only representation of a user.
 *
 * Intended usage:
 * - User card/grid views
 * - Browsing and selection contexts
 *
 * Design principles:
 * - Strong identity hierarchy (avatar → name → details)
 * - Centered, scannable layout
 * - No business logic or navigation side effects
 */
const UserCard: FC<UserCardProps> = ({ user }) => {
  return (
    <CustomCard
      ariaLabel={`${user.fullName} - User Card`}
      role="article"
      sx={{
        maxWidth: 320,
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
      contentSx={{ p: 3 }}
    >
      {/* ===============================
       * Card Layout (Vertical)
       * =============================== */}
      <Stack spacing={2.5} alignItems="center">
        {/* --------------------------------
         * Avatar
         * -------------------------------- */}
        <Avatar
          alt={user.fullName}
          src={
            user.avatarUrl
              ? formatImageUrl(user.avatarUrl)
              : USER_DEFAULT_PLACEHOLDER
          }
          sx={{
            width: 80,
            height: 80,
            fontSize: '2rem',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
          }}
        >
          {user.fullName?.charAt(0) ?? '?'}
        </Avatar>

        {/* --------------------------------
         * Name + Job Title
         * -------------------------------- */}
        <Stack spacing={0.5} alignItems="center">
          <CustomTypography variant="h6" fontWeight={700} align="center">
            {formatLabel(user.fullName)}
          </CustomTypography>

          {user.jobTitle && (
            <CustomTypography
              variant="body2"
              align="center"
              sx={{ color: 'text.secondary' }}
            >
              {formatLabel(user.jobTitle)}
            </CustomTypography>
          )}
        </Stack>

        {/* --------------------------------
         * Divider
         * -------------------------------- */}
        <Divider
          sx={{
            width: '60%',
            opacity: 0.8,
          }}
        />

        {/* --------------------------------
         * Identity Details
         * -------------------------------- */}
        <DetailsSection
          columns={1}
          align="center"
          sx={{
            width: '100%',
            '& .MuiGrid-item': {
              mb: 1.2,
            },
          }}
          fields={[
            {
              label: 'Email',
              value: user.email,
              format: formatLabel,
            },
            {
              label: 'Phone',
              value: user.phoneNumber,
              format: (value) => formatPhoneNumber(value, { fallback: '—' }),
            },
            {
              label: 'Role',
              value: user.roleName,
              format: formatLabel,
            },
            {
              label: 'Status',
              value: user.statusName,
              format: formatLabel,
            },
          ]}
        />
      </Stack>
    </CustomCard>
  );
};

export default memo(UserCard);
