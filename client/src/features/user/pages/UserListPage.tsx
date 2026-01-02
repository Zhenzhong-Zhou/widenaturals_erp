import useUserPageController from '@features/user/hooks/useUserPageController';
import UserListLayout from '@features/user/layouts/UserListLayout';

/**
 * Users page rendered in list (table) view.
 *
 * Responsibilities:
 * - Initializes the user page controller with `list` view mode
 * - Delegates all rendering and interaction logic to `UserListLayout`
 *
 * Design notes:
 * - This page contains no business logic or data transformation
 * - Table-specific behavior is encapsulated in the layout
 * - Shared data handling is provided by the controller
 */
const UserListPage = () => {
  const controller = useUserPageController({ viewMode: 'list' });

  return <UserListLayout controller={controller} />;
};

export default UserListPage;
