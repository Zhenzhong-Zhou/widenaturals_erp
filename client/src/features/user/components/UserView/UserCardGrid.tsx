import type { FC } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import NoDataFound from '@components/common/NoDataFound';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';
import { UserCard } from '@features/user/components/UserView';
import { FlattenedUserRecord } from '@features/user/state';

interface UserCardGridProps {
  /** Users to render as cards */
  users: FlattenedUserRecord[];

  /** Loading state */
  loading: boolean;

  /** Error message, if any */
  error?: string | null;

  /**
   * Optional action invoked when the user chooses to
   * clear all active filters and retry the query.
   *
   * Typically used in empty-state scenarios where
   * no results match the current filter criteria.
   */
  onResetFilters?: () => void;
}

/**
 * Grid layout for rendering user cards.
 *
 * Responsibilities:
 * - Renders a responsive grid of `UserCard` components
 * - Handles loading, error, and empty states
 *
 * Does NOT:
 * - Fetch or transform data
 * - Manage pagination or filtering
 *
 * Intended usage:
 * - Card-based user list layouts
 */
const UserCardGrid: FC<UserCardGridProps> = ({
  users,
  loading,
  error,
  onResetFilters,
}) => {
  if (loading) {
    return <Loading variant="dotted" message="Loading users..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!users.length) {
    return (
      <NoDataFound
        message="No users found."
        action={
          onResetFilters ? (
            <CustomButton onClick={onResetFilters}>Reset</CustomButton>
          ) : undefined
        }
      />
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid
            key={user.userId}
            size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }}
          >
            <UserCard user={user} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserCardGrid;
