import useUserPageController from '@features/user/hooks/useUserPageController';
import UserCardLayout from '@features/user/layouts/UserCardLayout';

/**
 * Users page rendered in card (grid) view.
 *
 * Responsibilities:
 * - Initializes the user page controller with `card` view mode
 * - Delegates all rendering and UI concerns to `UserCardLayout`
 *
 * Design notes:
 * - This page contains no business logic or data transformation
 * - View-specific behavior is driven entirely by the controller
 * - Switching to list view is handled by a separate page/layout
 */
const UserCardPage = () => {
  const controller = useUserPageController({ viewMode: 'card' });

  return <UserCardLayout controller={controller} />;
};

export default UserCardPage;
